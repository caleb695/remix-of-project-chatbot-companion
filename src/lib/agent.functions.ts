import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listAgentEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ threadId: z.string().uuid(), taskId: z.string().optional() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("agent_events")
      .select("id, task_id, agent_id, agent_label, phase, kind, text, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (data.taskId) q = q.eq("task_id", data.taskId);
    const { data: rows, error } = await q.limit(500);
    if (error) throw error;
    return rows ?? [];
  });

export const getLatestTask = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ threadId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase
      .from("agent_events")
      .select("task_id, phase, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return row;
  });

export const getStagedChanges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ repoId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("working_files")
      .select("path, status, updated_at")
      .eq("repo_selection_id", data.repoId)
      .neq("status", "unchanged")
      .order("path");
    if (error) throw error;
    return rows ?? [];
  });

export const setThreadMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), mode: z.enum(["plan", "build", "debug", "improve"]) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("chat_threads")
      .update({ mode: data.mode })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Summarise a thread and open a fresh thread seeded with that summary. */
export const branchThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ threadId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: thread, error: te } = await context.supabase
      .from("chat_threads")
      .select("id, title, model, mode, repo_selection_id, seed_summary")
      .eq("id", data.threadId)
      .single();
    if (te) throw te;

    const { data: msgs } = await context.supabase
      .from("chat_messages")
      .select("role, parts")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true })
      .limit(400);

    const partsText = (parts: unknown) =>
      Array.isArray(parts)
        ? parts.map((p: { type?: string; text?: string }) => (p?.type === "text" ? (p.text ?? "") : "")).join("")
        : "";
    const transcript = (msgs ?? [])
      .map((m) => `${m.role.toUpperCase()}: ${partsText(m.parts)}`)
      .filter((l) => l.length > 12)
      .join("\n\n")
      .slice(-60_000);

    if (!transcript) throw new Error("Nothing to summarise in this chat yet");

    const { data: settings } = await context.supabase
      .from("openrouter_settings")
      .select("api_key, mistral_api_key, groq_api_key, nvidia_api_key, model")
      .maybeSingle();
    if (!settings) throw new Error("Add an AI provider key on the Account tab first");
    const modelId = thread.model || settings.model;
    const route = modelId.startsWith("mistral:")
      ? { base: "https://api.mistral.ai/v1", key: settings.mistral_api_key, prefix: "mistral:" }
      : modelId.startsWith("groq:")
        ? { base: "https://api.groq.com/openai/v1", key: settings.groq_api_key, prefix: "groq:" }
        : modelId.startsWith("nvidia:")
          ? { base: "https://integrate.api.nvidia.com/v1", key: settings.nvidia_api_key, prefix: "nvidia:" }
          : { base: "https://openrouter.ai/api/v1", key: settings.api_key, prefix: "" };
    if (!route.key) throw new Error("Add the API key for this chat's model first");

    const res = await fetch(`${route.base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${route.key}` },
      body: JSON.stringify({
        model: modelId.slice(route.prefix.length),
        messages: [
          {
            role: "system",
            content:
              "Summarise this coding conversation so another AI agent can continue the work with full understanding. Capture: the overall goal, key decisions and constraints, what has been implemented so far, what is still pending, and anything that failed or must be avoided. Be dense and concrete. No preamble, no code blocks.",
          },
          { role: "user", content: transcript },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Summary failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const summary = body.choices?.[0]?.message?.content?.trim();
    if (!summary) throw new Error("The model returned an empty summary");

    const combined = thread.seed_summary ? `${thread.seed_summary}\n\n---\n\n${summary}` : summary;

    const { data: row, error } = await context.supabase
      .from("chat_threads")
      .insert({
        user_id: context.userId,
        repo_selection_id: thread.repo_selection_id,
        title: `Branch of ${thread.title}`.slice(0, 120),
        model: thread.model,
        mode: thread.mode,
        seed_summary: combined,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { threadId: row.id, summary };
  });

export const getThreadSeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase
      .from("chat_threads")
      .select("seed_summary, mode")
      .eq("id", data.id)
      .maybeSingle();
    return row;
  });
