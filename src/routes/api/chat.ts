import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, convertToModelMessages, stepCountIs, consumeStream, type UIMessage } from "ai";

type Mode = "plan" | "build" | "debug" | "improve";

const MODE_PROMPTS: Record<Mode, string> = {
  plan:
    "MODE: PLAN. You are brainstorming with the user. You may read and search the repository, but you must NOT change any file — you have no write tools in this mode. Ask the user clarifying questions about their code and intent, propose approaches, and end with a concrete step-by-step plan. Tell them to switch to Build mode when they want it implemented.",
  build:
    "MODE: BUILD. Implement the user's request end to end. Read the files you need, make focused edits with write_file/edit_file/delete_file, then call check_code. If check_code reports problems, fix them and call check_code again. Repeat until it is clean AND the task is actually complete. Only then write your final summary.",
  debug:
    "MODE: DEBUG. Find and fix real bugs and problems that are likely to happen — not speculative low-probability ones. Read the relevant code, search for the failure surface, fix it, then call check_code and repeat until clean. Explain each root cause you fixed.",
  improve:
    "MODE: IMPROVE. Improve the codebase: add sensible features, simplify and speed up existing code, remove duplication, and harden weak spots. Make real edits, then call check_code and repeat until clean. Do not restructure everything at once — make a coherent set of improvements and explain them.",
};

const PHASE = { planning: "planning", coding: "coding", checking: "checking", debugging: "debugging", done: "done" } as const;

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
        await logEvent("status", `Received task in ${mode} mode`, PHASE.planning);
        await logEvent("thought", "Working out what this task needs and which files matter.", PHASE.planning);

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
        if (!isKaggle && thread.repo_selection_id && embeddingKey && lastUserText) {
          try {
            const embRes = await fetch(embeddingUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${embeddingKey}` },
              body: JSON.stringify({ model: settings.embedding_model, input: [lastUserText.slice(0, 4000)] }),
            });
            if (embRes.ok) {
              const embBody = (await embRes.json()) as { data: { embedding: number[] }[] };
              const vec = embBody.data[0]?.embedding;
              if (vec) {
                const { data: hits } = await supa.rpc("match_repo_chunks", {
                  p_repo_selection_id: thread.repo_selection_id,
                  p_query: vec as unknown as string,
                  p_match_count: 8,
                });
                if (hits?.length) {
                  ragContext =
                    "Relevant repo code (semantic search):\n\n" +
                    hits
                      .map((h: { path: string; content: string }) => `--- ${h.path} ---\n${(h.content ?? "").slice(0, 1200)}`)
                      .join("\n\n");
                }
              }
            }
          } catch {
            /* best-effort */
          }

          const { data: files } = await supa
            .from("repo_files")
            .select("path, summary")
            .eq("repo_selection_id", thread.repo_selection_id)
            .limit(400);
          if (files?.length) {
            const outline = files
              .map((f) => (f.summary ? `${f.path} — ${f.summary}` : f.path))
              .join("\n")
              .slice(0, 8000);
            ragContext = `Repository file outline:\n${outline}\n\n${ragContext}`;
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
        const retryingFetch: typeof fetch = async (input, init) => {
          for (let attempt = 0; ; attempt++) {
            const res = await fetch(input as string, init);
            if (res.status !== 429) return res;
            const text = await res.clone().text();
            const isRpm = /per.?minute|rpm|requests per|rate.?limit/i.test(text) || !/quota|credit|balance|billing/i.test(text);
            if (!isRpm) return res;
            await logEvent("status", "Rate limited — waiting 10s and retrying.", PHASE.coding);
            await new Promise((r) => setTimeout(r, 10_000));
            if (attempt > 200) return res;
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
          isKaggle ? "" : "Before editing, read the files you are about to change. Prefer edit_file for small changes.",
          "When you finish, summarise what you changed, why, and anything the user needs to know or do.",
          MODE_PROMPTS[mode],
          thread.seed_summary ? `Context carried over from the previous chat:\n${thread.seed_summary}` : "",
          attachmentContext,
          ragContext,
        ]
          .filter(Boolean)
          .join("\n\n");

        let phase: string = PHASE.planning;
        let sawWrite = false;
        let sawCheck = false;

        const result = streamText({
          model,
          system: systemPrompt,
          messages: await convertToModelMessages(messages),
          tools,
          stopWhen: stepCountIs(60),
          onStepFinish: async (step) => {
            for (const call of step.toolCalls ?? []) {
              const name = call.toolName;
              const input = (call.input ?? {}) as { path?: string; query?: string };
              if (name === "write_notebook" || name === "edit_notebook") {
                if (sawCheck) phase = PHASE.debugging;
                else phase = PHASE.coding;
                sawWrite = true;
                await logEvent("action", name === "write_notebook" ? "Rewrote the notebook source" : "Edited the notebook source", phase);
              } else if (name === "read_notebook") {
                await logEvent("action", "Read the notebook source", phase);
              } else if (name === "search_notebook") {
                await logEvent("action", `Searched the notebook for "${input.query ?? ""}"`, phase);
              } else if (name === "write_file" || name === "edit_file" || name === "delete_file") {
                if (sawCheck) phase = PHASE.debugging;
                else phase = PHASE.coding;
                sawWrite = true;
                const verb = name === "write_file" ? "Wrote" : name === "edit_file" ? "Edited" : "Deleted";
                await logEvent("action", `${verb} ${input.path ?? "file"}`, phase);
              } else if (name === "check_code") {
                phase = PHASE.checking;
                sawCheck = true;
                await logEvent("action", "Checked the code I changed for problems", phase);
              } else if (name === "read_file") {
                await logEvent("action", `Read ${input.path ?? "file"}`, phase);
              } else if (name === "list_files") {
                await logEvent("action", "Listed the repository files", phase);
              } else if (name === "search_code") {
                await logEvent("action", `Searched for "${input.query ?? ""}"`, phase);
              } else if (name === "staged_changes") {
                await logEvent("action", "Reviewed the staged changes", phase);
              }
            }
            const reasoning = step.text?.trim();
            if (reasoning) {
              await logEvent("thought", reasoning.slice(0, 800), phase);
            }
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            const assistant = finalMessages[finalMessages.length - 1];
            if (assistant?.role === "assistant") {
              await supa.from("chat_messages").insert({
                thread_id: threadId,
                user_id: userId,
                role: "assistant",
                parts: assistant.parts as unknown as object,
              });
              await supa.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
            }
            await logEvent(
              "status",
              sawWrite ? "Finished the task and staged the changes." : "Finished.",
              PHASE.done,
            );
          },
          onError: (error) => {
            const msg = error instanceof Error ? error.message : String(error);
            void logEvent("error", msg, phase);
            return msg;
          },
        });
      },
    },
  },
});
