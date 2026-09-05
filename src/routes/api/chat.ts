import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, convertToModelMessages, stepCountIs, consumeStream, type UIMessage } from "ai";
import { AsyncLocalStorage } from "node:async_hooks";

// Access H3Event via the same global symbol TanStack Start uses internally
// This allows us to use waitUntil for background work on serverless platforms
const GLOBAL_EVENT_STORAGE_KEY = Symbol.for("tanstack-start:event-storage");
const globalObj = globalThis as typeof globalThis & {
  [GLOBAL_EVENT_STORAGE_KEY]?: AsyncLocalStorage<{ h3Event: { waitUntil: (p: Promise<any>) => void } }>;
};

function getH3Event() {
  const storage = globalObj[GLOBAL_EVENT_STORAGE_KEY];
  if (!storage) {
    throw new Error("No StartEvent storage found. Make sure you are using the function within the server runtime.");
  }
  const event = storage.getStore();
  if (!event) {
    throw new Error("No StartEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.");
  }
  return event.h3Event;
}

type Mode = "plan" | "build" | "debug" | "improve";

// The write tools differ per target, so the mode instructions have to name the
// tools the model was actually given — naming repo file tools in a Kaggle run
// makes the model "finish" without ever editing the notebook.
function modePrompts(isKaggle: boolean): Record<Mode, string> {
  const subject = isKaggle ? "the notebook source" : "the repository";
  const read = isKaggle ? "Read the notebook with read_notebook" : "Read the files you need";
  const writeTools = isKaggle ? "write_notebook/edit_notebook" : "write_file/edit_file/delete_file";
  const editing = `${read}, make focused edits with ${writeTools}, then call check_code. If check_code reports problems, fix them and call check_code again. Repeat until it is clean AND the task is actually complete. Only then write your final summary. You must actually call a write tool — a reply that only describes the change is a failed run.`;
  return {
    plan:
      `MODE: PLAN. You are brainstorming with the user. You may read and search ${subject}, but you must NOT change anything — you have no write tools in this mode. Ask the user clarifying questions about their code and intent, propose approaches, and end with a concrete step-by-step plan. Tell them to switch to Build mode when they want it implemented.`,
    build: `MODE: BUILD. Implement the user's request end to end. ${editing}`,
    debug:
      `MODE: DEBUG. Find and fix real bugs and problems that are likely to happen — not speculative low-probability ones. ${read}, search for the failure surface, fix it with ${writeTools}, then call check_code and repeat until clean. Explain each root cause you fixed.`,
    improve:
      `MODE: IMPROVE. Improve ${subject}: add sensible features, simplify and speed up existing code, remove duplication, and harden weak spots. Make real edits with ${writeTools}, then call check_code and repeat until clean. Do not restructure everything at once — make a coherent set of improvements and explain them.`,
  };
}

const PHASE = { planning: "planning", coding: "coding", checking: "checking", debugging: "debugging", done: "done" } as const;

/**
 * Turn whatever the provider/SDK threw into a readable message. Providers
 * often emit in-stream errors as plain objects (`{ message, code, type }` or
 * `{ error: { message } }`) rather than Error instances, which `String()`
 * renders as "[object Object]".
 */
function describeError(error: unknown, depth = 0): string {
  if (error == null) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    const e = error as Error & { responseBody?: unknown; statusCode?: number; cause?: unknown };
    let msg = e.message || e.name;
    if (typeof e.responseBody === "string" && e.responseBody && !msg.includes(e.responseBody.slice(0, 40))) {
      msg += ` — ${e.responseBody.slice(0, 600)}`;
    }
    if (e.cause && depth < 2) {
      const c = describeError(e.cause, depth + 1);
      if (c && c !== "Unknown error" && !msg.includes(c)) msg += ` (cause: ${c})`;
    }
    return msg;
  }
  if (typeof error === "object") {
    const o = error as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) {
      const code = o.code ?? o.type ?? o.status;
      return code ? `${o.message} (${String(code)})` : o.message;
    }
    if (o.error && depth < 2) return describeError(o.error, depth + 1);
    if (typeof o.detail === "string") return o.detail;
    try { return JSON.stringify(error).slice(0, 800); } catch { /* fall through */ }
  }
  return String(error);
}

/**
 * Interleave SSE comment lines (`: keepalive\n\n`) into a streaming Response
 * body while the model is silent. Comments are ignored by SSE clients but keep
 * the connection alive so a slow first token (reasoning models, large context)
 * isn't dropped by the platform/proxy and surfaced to the browser as a raw
 * "load failed". Stops as soon as the underlying stream closes.
 */
function withSseHeartbeat(response: Response): Response {
  if (!response.body) return response;
  const HEARTBEAT_MS = 15_000;
  const KEEPALIVE = new TextEncoder().encode(": keepalive\n\n");
  const source = response.body;
  const out = new ReadableStream<Uint8Array>({
    start(controller) {
      const pump = async () => {
        const reader = source.getReader();
        const beat = () => {
          try { controller.enqueue(KEEPALIVE); } catch { /* closed */ }
        };
        const timer: ReturnType<typeof setInterval> | undefined = setInterval(beat, HEARTBEAT_MS);
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) controller.enqueue(value);
          }
        } catch {
          /* reader errored; let the stream close */
        } finally {
          if (timer) clearInterval(timer);
          try { controller.close(); } catch { /* already closed */ }
        }
      };
      pump();
    },
    cancel() {
      try { source.cancel(); } catch { /* already cancelled */ }
    },
  });
  return new Response(out, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const token = auth.slice(7);

        const { createClient } = await import("@supabase/supabase-js");
        const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
        });
        const { data: userData, error: uerr } = await supa.auth.getUser(token);
        if (uerr || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const body = (await request.json()) as {
          messages: UIMessage[];
          threadId: string;
          taskId?: string;
          mode?: Mode;
        };
        const { messages, threadId } = body;
        const taskId = body.taskId || crypto.randomUUID();
        if (!threadId) return new Response("Missing threadId", { status: 400 });

        const { data: thread } = await supa
          .from("chat_threads")
          .select("id, title, model, mode, seed_summary, target, repo_selection_id, kaggle_notebook_id")
          .eq("id", threadId)
          .maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });
        const isKaggle = thread.target === "kaggle" && Boolean(thread.kaggle_notebook_id);

        const mode: Mode = (body.mode ?? (thread.mode as Mode) ?? "build");

        const { data: settings } = await supa
          .from("openrouter_settings")
          .select("api_key, model, mistral_api_key, groq_api_key, nvidia_api_key, embedding_provider, embedding_model")
          .maybeSingle();
        if (!settings) return new Response("Add an AI provider key on the Account tab first.", { status: 400 });
        const modelId = thread.model || settings.model;

        // ---- activity log helpers -------------------------------------------------
        const logEvent = async (
          kind: "thought" | "action" | "status" | "error",
          text: string,
          phase: string,
          agent = { id: "main", label: "Main agent" },
        ) => {
          await supa.from("agent_events").insert({
            user_id: userId,
            thread_id: threadId,
            task_id: taskId,
            agent_id: agent.id,
            agent_label: agent.label,
            phase,
            kind,
            text: text.slice(0, 4000),
          });
        };

        // ---- heartbeat to keep job alive even during long model "thinking" ----
        // The getJob stale check uses updated_at. Without tool calls, no logEvent fires.
        // This heartbeat runs every 30s to prevent false "tab closed" failures.
        let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
        const startHeartbeat = () => {
          if (heartbeatTimer) return;
          // Fire immediately, then every 30s
          void supa.from("coding_jobs").update({ updated_at: new Date().toISOString() }).eq("id", kaggleJobId);
          heartbeatTimer = setInterval(() => {
            void supa.from("coding_jobs").update({ updated_at: new Date().toISOString() }).eq("id", kaggleJobId);
          }, 30_000);
        };
        const stopHeartbeat = () => {
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }
        };

        // ---- persist the user turn ------------------------------------------------
        const lastUser = messages[messages.length - 1];
        const lastUserText =
          lastUser?.role === "user"
            ? lastUser.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").trim()
            : "";
        if (lastUser?.role === "user") {
          await supa.from("chat_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            parts: lastUser.parts as unknown as object,
          });
          if (thread.title === "New chat") {
            const text = lastUserText.slice(0, 60);
            if (text) await supa.from("chat_threads").update({ title: text }).eq("id", threadId);
          }
        }
        // Log that we received the message - for long-running modes, this helps the AI
        // see that new user input arrived while it was working
        await logEvent("status", `Received task in ${mode} mode`, PHASE.planning);
        await logEvent("thought", "Working out what this task needs and which files matter. For long-running sessions, check if there are newer user messages to incorporate.", PHASE.planning);

        // Kaggle runs stream in-page, but track them as a coding_job so the run
        // (status + activity + staged notebook edits) is durable like GitHub
        // runs: closing the tab no longer loses the record of what happened.
        let kaggleJobId: string | null = null;
        if (isKaggle) {
          const { data: kj } = await supa.from("coding_jobs").insert({
            user_id: userId,
            thread_id: threadId,
            repo_selection_id: null,
            status: "running",
            prompt: lastUserText || "",
            model: modelId,
            job_type: "kaggle",
            mode,
            task_id: taskId,
            logs: "",
          }).select("id").single();
          kaggleJobId = kj?.id ?? null;
        }
        // Start heartbeat to keep job alive during long model generations
        if (kaggleJobId) startHeartbeat();

        // ---- repo context (RAG + outline) ----------------------------------------
        let ragContext = "";
        const embeddingKey =
          settings.embedding_provider === "mistral"
            ? settings.mistral_api_key
            : settings.embedding_provider === "nvidia"
              ? settings.nvidia_api_key
              : settings.api_key;
        const embeddingUrl =
          settings.embedding_provider === "mistral"
            ? "https://api.mistral.ai/v1/embeddings"
            : settings.embedding_provider === "nvidia"
              ? "https://integrate.api.nvidia.com/v1/embeddings"
              : "https://openrouter.ai/api/v1/embeddings";
        
        // Run semantic search and file outline in parallel to reduce latency
        if (!isKaggle && thread.repo_selection_id && embeddingKey && lastUserText) {
          const [semanticResult, outlineResult] = await Promise.all([
            // Semantic search
            (async () => {
              try {
                const embRes = await fetch(embeddingUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${embeddingKey}` },
                  body: JSON.stringify({ model: settings.embedding_model, input: [lastUserText.slice(0, 4000)] }),
                });
                if (!embRes.ok) return null;
                const embBody = (await embRes.json()) as { data: { embedding: number[] }[] };
                const vec = embBody.data[0]?.embedding;
                if (!vec) return null;
                const { data: hits } = await supa.rpc("match_repo_chunks", {
                  p_repo_selection_id: thread.repo_selection_id,
                  p_query: vec as unknown as string,
                  p_match_count: 8,
                });
                if (!hits?.length) return null;
                return hits
                  .map((h: { path: string; content: string }) => `--- ${h.path} ---\n${(h.content ?? "").slice(0, 1200)}`)
                  .join("\n\n");
              } catch {
                return null;
              }
            })(),
            // File outline
            (async () => {
              try {
                const { data: files } = await supa
                  .from("repo_files")
                  .select("path, summary")
                  .eq("repo_selection_id", thread.repo_selection_id)
                  .limit(400);
                if (!files?.length) return null;
                return files
                  .map((f) => (f.summary ? `${f.path} — ${f.summary}` : f.path))
                  .join("\n")
                  .slice(0, 8000);
              } catch {
                return null;
              }
            })(),
          ]);

          const outline = outlineResult;
          const semantic = semanticResult;

          if (outline && semantic) {
            ragContext = `Repository file outline:\n${outline}\n\nRelevant repo code (semantic search):\n\n${semantic}`;
          } else if (outline) {
            ragContext = `Repository file outline:\n${outline}`;
          } else if (semantic) {
            ragContext = `Relevant repo code (semantic search):\n\n${semantic}`;
          }
        }

        // ---- provider routing with RPM retry -------------------------------------
        const route = modelId.startsWith("mistral:")
          ? { name: "mistral", prefix: "mistral:", baseURL: "https://api.mistral.ai/v1", key: settings.mistral_api_key }
          : modelId.startsWith("groq:")
            ? { name: "groq", prefix: "groq:", baseURL: "https://api.groq.com/openai/v1", key: settings.groq_api_key }
            : modelId.startsWith("nvidia:")
              ? { name: "nvidia", prefix: "nvidia:", baseURL: "https://integrate.api.nvidia.com/v1", key: settings.nvidia_api_key }
              : { name: "openrouter", prefix: "", baseURL: "https://openrouter.ai/api/v1", key: settings.api_key };
        if (!route.key) return new Response(`Add your ${route.name} API key on the Account tab.`, { status: 400 });

        // On a per-minute rate limit: wait 10s and retry, forever. Any other limit
        // (quota/credits/context) stops the run and surfaces the provider's message.
        // A per-request timeout + transient retry keeps a hung/slow provider
        // connection from stalling the SSE response until the platform kills it
        // (which the browser surfaces as a raw "load failed"). On exhausted
        // retries the stream errors and onError logs a terminal event.
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        const retryingFetch: typeof fetch = async (input, init) => {
          let rpmWaits = 0;
          let transient = 0;
          for (;;) {
            let res: Response;
            try {
              // Combine the SDK's abort signal (so client disconnects still
              // cancel the provider request) with a hard timeout so a stuck
              // connection can't hang the whole run.
              const timeoutSignal = AbortSignal.timeout(1000 * 60 * 5);
              const signal = init?.signal
                ? (AbortSignal.any ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal)
                : timeoutSignal;
              res = await fetch(input as string, {
                ...init,
                signal,
              });
            } catch (e) {
              if (++transient > 4) {
                throw new Error(
                  "Could not reach the model provider after several attempts: " +
                  ((e instanceof Error ? e.message : String(e)) || "network error"),
                );
              }
              await sleep(Math.min(20_000, 2000 * transient));
              continue;
            }
            if (res.status !== 429) {
              // Retry transient server errors so a provider hiccup doesn't fail the run.
              if ((res.status === 408 || res.status >= 500) && ++transient <= 4) {
                await sleep(Math.min(20_000, 2000 * transient));
                continue;
              }
              return res;
            }
            const text = await res.clone().text();
            const isRpm = /per.?minute|rpm|requests per|rate.?limit/i.test(text) || !/quota|credit|balance|billing/i.test(text);
            if (!isRpm) return res;
            await logEvent("status", "Rate limited — waiting 10s and retrying.", PHASE.coding);
            await sleep(10_000);
            if (++rpmWaits > 200) return res;
          }
        };

        const provider = createOpenAICompatible({
          name: route.name,
          baseURL: route.baseURL,
          fetch: retryingFetch,
          headers: {
            Authorization: `Bearer ${route.key}`,
            ...(route.name === "openrouter"
              ? { "HTTP-Referer": new URL(request.url).origin, "X-Title": "Coderbot" }
              : {}),
          },
        });
        const model = provider(modelId.slice(route.prefix.length));

        // ---- tools ---------------------------------------------------------------
        let tools;
        if (isKaggle) {
          const { buildKaggleTools } = await import("@/lib/kaggle.server");
          tools = buildKaggleTools(
            { sb: supa, notebookId: thread.kaggle_notebook_id! },
            { allowWrites: mode !== "plan" },
          );
        } else {
          const { buildAgentTools } = await import("@/lib/agent-tools.server");
          tools = buildAgentTools(
            { sb: supa, userId, repoId: thread.repo_selection_id! },
            { allowWrites: mode !== "plan" },
          );
        }

        // Uploaded files: readable ones get inlined as text, the rest are just named.
        const { data: attRows } = await supa
          .from("chat_attachments")
          .select("name, mime_type, storage_path, code_only")
          .eq("thread_id", threadId);
        let attachmentContext = "";
        if (attRows && attRows.length > 0) {
          const parts: string[] = [
            "The user uploaded these files; they are available to the coding runner under uploads/: " +
              attRows.map((a) => `uploads/${a.name}${a.code_only ? " (asset only — contents hidden from you)" : ""}`).join(", ") + ".",
          ];
          for (const a of attRows) {
            if (a.code_only || /^image\//.test(a.mime_type ?? "")) continue;
            const { data: blob } = await supa.storage.from("attachments").download(a.storage_path);
            if (!blob) continue;
            const text = (await blob.text()).slice(0, 20000);
            parts.push(`--- uploads/${a.name} ---\n${text}`);
          }
          attachmentContext = parts.join("\n\n");
        }

        const systemPrompt = [
          isKaggle
            ? "You are Coderbot, an autonomous coding agent working on a single Kaggle notebook through a staged working copy of its source."
            : "You are Coderbot, an autonomous coding agent working on the user's repository through an in-app working copy.",
          isKaggle
            ? "Your tools edit a staged copy of the notebook source. Nothing reaches Kaggle until the user presses Commit, so you may edit freely. Always read_notebook before editing, and prefer edit_notebook for targeted changes."
            : "Your file tools edit a staged working copy. Nothing reaches GitHub until the user presses Commit, so you may edit freely.",
          "Never claim you changed code unless you actually called a write tool and it succeeded.",
          "Use search_web to look up current docs, package versions, APIs or fixes when you are not sure, instead of guessing — but prefer the repo's own code when the answer lives there.",
          isKaggle
            ? "Before editing, call read_notebook once so your find/replace anchors match the current source. Prefer edit_notebook/batch_edit_notebook for targeted changes over rewriting the whole notebook."
            : "Before editing, read the files you are about to change. Use glob to locate files by pattern instead of listing the whole repo, and batch_read_files to read several files at once instead of many read_file calls. Prefer edit_file for small changes. You also have read-only reference-repo tools for other connected GitHub repos; use them when the user asks you to copy or adapt code from another repo, but only write changes to the current repo.",
          "When you finish, summarise what you changed, why, and anything the user needs to know or do.",
          modePrompts(isKaggle)[mode],
          thread.seed_summary ? `Context carried over from the previous chat:\n${thread.seed_summary}` : "",
          attachmentContext,
          ragContext,
        ]
          .filter(Boolean)
          .join("\n\n");

        let phase: string = PHASE.planning;
        // Watchdog: a provider request that hangs (or is rejected upstream
        // without an SSE error) used to leave the UI frozen on "planning" with
        // no explanation. Report progress/failure so the run always resolves.
        let sawFirstStep = false;
        const slowTimer = setTimeout(() => {
          if (!sawFirstStep) void logEvent("status", "Still waiting on the model's first response…", PHASE.planning);
        }, 90_000);
        const stallTimer = setTimeout(() => {
          if (!sawFirstStep) {
            void logEvent("error", "The model provider never responded. Check your API key and model on the Account tab, then try again.", PHASE.done);
          }
        }, 6 * 60 * 1000);
        const clearWatchdog = () => { clearTimeout(slowTimer); clearTimeout(stallTimer); };
        let sawWrite = false;
        let sawCheck = false;
        // Guard against a degenerate loop where the model keeps invoking the
        // same read-only tool calls without making progress (mirrors the
        // runner's toolRepeatStreak guard). Also force a check_code before the
        // model is allowed to finish on unverified edits.
        let verifyNudged = false;
        let lastToolSig: string | null = null;
        let toolRepeatStreak = 0;

        const WRITE_TOOL_NAMES = new Set(["write_file", "edit_file", "delete_file", "batch_edit_files", "write_notebook", "edit_notebook", "batch_edit_notebook"]);

        // Adaptive step limit: more steps for build/debug/improve, fewer for plan
        // Kaggle runs don't have GitHub Actions runner, so they need more steps to complete
        // the work in a single in-page session.
        const baseSteps = mode === "plan" ? 25 : mode === "debug" ? 100 : mode === "improve" ? 80 : 50;
        const steps = isKaggle ? baseSteps * 1.5 : baseSteps; // Kaggle gets 50% more steps
        const stepLimit = Math.floor(steps);

        const result = streamText({
          model,
          system: systemPrompt,
          messages: await convertToModelMessages(messages),
          tools,
          stopWhen: stepCountIs(stepLimit),
          // Retry transient tool execution errors
          maxRetries: 2,
          prepareStep: ({ steps }) => {
            const last = steps[steps.length - 1];
            const calls = (last?.toolCalls ?? []) as Array<{ toolName: string; input?: unknown }>;
            // Degenerate-loop interrupt: three identical read-only turns in a
            // row with no writes. Nudge the model to change approach so it
            // doesn't burn the rest of the step budget spinning.
            if (toolRepeatStreak >= 3) {
              toolRepeatStreak = 0;
              lastToolSig = null;
              return {
                messages: [
                  { role: "user" as const, content: [{ type: "text" as const, text: "You have repeated the same read-only calls three times without making edits. Reconsider your approach — read what you need, then actually change files (or call finish if the task is already done). Do not repeat the same calls again." }] },
                ],
              };
            }
            // Verify-before-finish: if the model produced a text-only step (no
            // tool calls) after writing but never checked, nudge it once to run
            // check_code instead of letting it finish on unchecked work.
            if (mode !== "plan" && sawWrite && !sawCheck && !verifyNudged && calls.length === 0) {
              verifyNudged = true;
              return {
                messages: [
                  { role: "user" as const, content: [{ type: "text" as const, text: "You changed code but never ran check_code. Call check_code now, fix anything it reports, then write your final summary." }] },
                ],
              };
            }
            return {};
          },
          onStepFinish: async (step) => {
            sawFirstStep = true;
            clearWatchdog();
            // Heartbeat the Kaggle job so a long-running in-page run isn't
            // mistaken for a dead one (getJob marks kaggle/running jobs stale
            // after 15 min of inactivity - updated from 5 min).
            if (isKaggle && kaggleJobId) {
              void supa.from("coding_jobs").update({ updated_at: new Date().toISOString() }).eq("id", kaggleJobId);
            }
            // Process tool calls - batch logEvent calls for efficiency
            const toolCalls = step.toolCalls ?? [];
            if (toolCalls.length > 0) {
              const logPromises = [];
              for (const call of toolCalls) {
                const name = call.toolName;
                const input = (call.input ?? {}) as { path?: string; query?: string; source?: string; pattern?: string; paths?: string[] };
                if (name === "write_notebook" || name === "edit_notebook") {
                  if (sawCheck) phase = PHASE.debugging;
                  else phase = PHASE.coding;
                  sawWrite = true;
                  logPromises.push(logEvent("action", name === "write_notebook" ? "Rewrote the notebook source" : "Edited the notebook source", phase));
                } else if (name === "read_notebook") {
                  logPromises.push(logEvent("action", "Read the notebook source", phase));
                } else if (name === "search_notebook") {
                  logPromises.push(logEvent("action", `Searched the notebook for "${input.query ?? ""}"`, phase));
                } else if (name === "batch_edit_notebook") {
                  if (sawCheck) phase = PHASE.debugging;
                  else phase = PHASE.coding;
                  sawWrite = true;
                  logPromises.push(logEvent("action", "Applied batch edits to the notebook source", phase));
                } else if (name === "write_file" || name === "edit_file" || name === "delete_file" || name === "batch_edit_files") {
                  if (sawCheck) phase = PHASE.debugging;
                  else phase = PHASE.coding;
                  sawWrite = true;
                  const verb = name === "write_file" ? "Wrote" : name === "edit_file" || name === "batch_edit_files" ? "Edited" : "Deleted";
                  logPromises.push(logEvent("action", `${verb} ${input.path ?? "file"}`, phase));
                } else if (name === "batch_read_files") {
                  logPromises.push(logEvent("action", `Read ${Array.isArray(input.paths) ? input.paths.length : 0} files`, phase));
                } else if (name === "check_code") {
                  phase = PHASE.checking;
                  sawCheck = true;
                  logPromises.push(logEvent("action", "Checked the code I changed for problems", phase));
                } else if (name === "read_file") {
                  logPromises.push(logEvent("action", `Read ${input.path ?? "file"}`, phase));
                } else if (name === "list_files") {
                  logPromises.push(logEvent("action", "Listed the repository files", phase));
                } else if (name === "glob") {
                  logPromises.push(logEvent("action", `Globbed for "${input.pattern ?? ""}"`, phase));
                } else if (name === "search_code") {
                  logPromises.push(logEvent("action", `Searched for "${input.query ?? ""}"`, phase));
                } else if (name === "search_web") {
                  logPromises.push(logEvent("action", `Searched the web for "${input.query ?? ""}"`, phase));
                } else if (name === "staged_changes") {
                  logPromises.push(logEvent("action", "Reviewed the staged changes", phase));
                }
              }
              // Execute all log events in parallel
              await Promise.all(logPromises);
              
              // Degenerate-loop guard: if this step made only read-only calls
              // (no writes) and they are identical to the previous turn's calls,
              // count a streak. prepareStep reads these to interrupt the loop.
              const wrote = toolCalls.some((c) => WRITE_TOOL_NAMES.has(c.toolName));
              const sig = toolCalls.map((c) => c.toolName + ":" + JSON.stringify(c.input ?? {}).slice(0, 80)).join("|");
              if (!wrote && sig) {
                if (sig === lastToolSig) toolRepeatStreak += 1;
                else { lastToolSig = sig; toolRepeatStreak = 1; }
              } else {
                lastToolSig = null;
                toolRepeatStreak = 0;
              }
            }
            const reasoning = step.text?.trim();
            if (reasoning) {
              // Log thoughts with better truncation that preserves sentence boundaries
              const truncated = reasoning.length > 800
                ? reasoning.slice(0, Math.min(800, reasoning.lastIndexOf(".", 700))) + "..."
                : reasoning;
              await logEvent("thought", truncated, phase);
            }
          },
        });

        const streamResponse = result.toUIMessageStreamResponse({
          originalMessages: messages,
          // onFinish fires only when the response body stream is fully consumed.
          // In a serverless runtime (Cloudflare/nitro) the body stops being
          // consumed the moment the browser disconnects (e.g. the user switches
          // tabs mid-run, which chat-store.ts explicitly supports), so the
          // finalize work below — persisting the assistant turn, logging the
          // terminal `done` event, and marking the Kaggle job completed — used
          // to never run. That left the client showing a checkmark (its in-page
          // stream had ended) while nothing was actually committed: the
          // "checkmark and nothing happens" symptom. We now tee the body and
          // consume one branch server-side so onFinish is guaranteed to run
          // regardless of whether the client reads the other branch to the end.
          onFinish: async ({ messages: finalMessages }) => {

            const assistant = finalMessages[finalMessages.length - 1];
            // A run that died on a provider error has no real reply — persist
            // the error text itself so the chat shows what went wrong instead
            // of an empty bubble, and don't pretend the agent "only replied".
            const runError = streamError;
            if (assistant?.role === "assistant" || runError) {
              const baseParts = assistant?.role === "assistant" ? assistant.parts : [];
              const filtered = isKaggle
                ? baseParts.filter((p) => {
                    const type = String(p.type ?? "");
                    // Drop tool-call parts but keep text, tool-results, and other content
                    return !type.startsWith("tool-call");
                  })
                : [...baseParts];
              const hasText = filtered.some((p) => p.type === "text" && (p as { text?: string }).text?.trim());
              if (runError && !hasText) {
                filtered.push({ type: "text", text: `❌ The run stopped: ${runError}` } as never);
              }
              const parts = isKaggle
                ? [...filtered, { type: "data-run", data: { jobId: kaggleJobId ?? undefined, taskId, kaggle: true, status: runError ? "failed" : "completed" } }]
                : filtered;
              await supa.from("chat_messages").insert({
                thread_id: threadId,
                user_id: userId,
                role: "assistant",
                parts: parts as unknown as object,
              });
              await supa.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
            }
            if (!runError) {
              await logEvent(
                "status",
                sawWrite
                  ? "Finished the task and staged the changes."
                  : mode === "plan"
                    ? "Finished."
                    : `Finished without changing ${isKaggle ? "the notebook" : "any file"} — the agent only replied. Try again with a more specific instruction.`,
                PHASE.done,
              );
            }
            if (isKaggle && kaggleJobId) {
              await supa.from("coding_jobs").update({
                status: runError ? "failed" : "completed",
                error: runError ? runError.slice(0, 500) : null,
                summary: runError
                  ? null
                  : sawWrite ? "Finished and staged the notebook changes." : "Finished without changing the notebook.",
                finished_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }).eq("id", kaggleJobId);
            }
            clearWatchdog();
            stopHeartbeat();
          },
          onError: (error) => {
            const msg = describeError(error);
            console.error("[chat] stream error:", msg, error);
            // The same error surfaces once per teed branch — log it once.
            if (streamError === msg) return msg;
            streamError = msg;
            // Log the failure at the `done` phase so the process indicator stops
            // on a terminal state instead of freezing on a stale planning phase.
            void logEvent("error", msg, PHASE.done);
            clearWatchdog();
            return msg;
          },
        });

        // Tee the body: one branch goes to the client (through the SSE
        // heartbeat wrapper), the other is consumed server-side so the
        // onFinish/onError callbacks above are guaranteed to run even if the
        // browser disconnects before reading the whole response. Without this,
        // a dropped client connection left the run "finished" in the UI
        // (checkmark) but the assistant message, terminal `done` event, and
        // Kaggle job completion were never persisted.
        const responseBody = streamResponse.body;
        if (!responseBody) {
          // No body to stream (shouldn't happen for streamText, but stay safe):
          // consume the result so callbacks fire, then return the empty response.
          void consumeStream({ stream: result.toUIMessageStream() });
          return streamResponse;
        }
        const [toClient, toServer] = responseBody.tee();
        
        // Use waitUntil to ensure background consumption completes even after response is sent
        // This is critical for serverless platforms like Cloudflare Workers
        // Pass explicit abortSignal: null so server-side consumption isn't cancelled when client disconnects
        const consumeServerStream = () => consumeStream({ 
          stream: toServer,
          abortSignal: undefined, // Don't pass abort signal - let it run to completion
        });
        
        try {
          const event = getH3Event();
          event.waitUntil(consumeServerStream());
        } catch {
          // Fallback if not in H3Event context (e.g., during testing or non-TanStack runtimes)
          // Schedule the consumption as a microtask to ensure it runs after response is sent
          queueMicrotask(consumeServerStream);
        }
        
        return withSseHeartbeat(new Response(toClient, {
          status: streamResponse.status,
          statusText: streamResponse.statusText,
          headers: streamResponse.headers,
        }));
      },
    },
  },
});
