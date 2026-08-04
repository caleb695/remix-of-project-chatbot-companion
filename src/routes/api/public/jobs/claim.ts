import { createFileRoute } from "@tanstack/react-router";
import { authJobRequest } from "@/lib/job-auth.server";

export const Route = createFileRoute("/api/public/jobs/claim")({
  server: { handlers: { POST: async ({ request }) => {
    let ctx;
    try { ctx = await authJobRequest(request); } catch (r) { return r as Response; }
    const { job, sb } = ctx;

    // Load thread messages, openrouter key, gh token
    const isIndex = job.job_type === "index";
    const [{ data: msgs }, { data: or }, { data: gh }, { data: sel }] = await Promise.all([
      isIndex
        ? Promise.resolve({ data: [] as { role: string; parts: unknown }[] })
        : sb.from("chat_messages").select("role, parts").eq("thread_id", job.thread_id!).order("created_at"),
      sb.from("openrouter_settings")
        .select("api_key, mistral_api_key, groq_api_key, nvidia_api_key, embedding_provider, embedding_model")
        .eq("user_id", job.user_id).maybeSingle(),
      sb.from("github_connections").select("access_token").eq("user_id", job.user_id).maybeSingle(),
      sb.from("repo_selections").select("owner, name, working_branch").eq("id", job.repo_selection_id).single(),
    ]);
    if (!gh?.access_token) return new Response("no github token", { status: 400 });

    if (!or) return new Response("no provider settings", { status: 400 });
    const provider = (job.model ?? "").startsWith("mistral:") ? "mistral"
      : (job.model ?? "").startsWith("groq:") ? "groq"
      : (job.model ?? "").startsWith("nvidia:") ? "nvidia"
      : "openrouter";
    const providerKey = provider === "mistral" ? or.mistral_api_key
      : provider === "groq" ? or.groq_api_key
      : provider === "nvidia" ? or.nvidia_api_key
      : or.api_key;
    const embeddingKey = or.embedding_provider === "mistral" ? or.mistral_api_key
      : or.embedding_provider === "nvidia" ? or.nvidia_api_key
      : or.api_key;
    if (!providerKey) return new Response(`no ${provider} key`, { status: 400 });
    if (isIndex && !embeddingKey) return new Response(`no ${or.embedding_provider} embedding key`, { status: 400 });

    // Mark running
    await sb.from("coding_jobs").update({ status: "running", updated_at: new Date().toISOString() }).eq("id", job.id);

    const partsText = (parts: unknown) => {
      if (!Array.isArray(parts)) return "";
      return parts.map((p: { type?: string; text?: string }) => p?.type === "text" ? (p.text ?? "") : "").join("");
    };
    const messages = (msgs ?? []).map((m) => ({ role: m.role, content: partsText(m.parts) }));
    if (!isIndex && messages[messages.length - 1]?.content?.trim() !== job.prompt.trim()) {
      // The enqueue step normally persists the prompt as a user message already.
      messages.push({ role: "user", content: job.prompt });
    }

    const mode = (job.mode ?? "build") as "plan" | "build" | "debug" | "improve";
    const MODE_PROMPTS: Record<typeof mode, string> = {
      plan: "MODE: PLAN. Explore and reason about the repository but do NOT change any file. End with a concrete step-by-step plan, then call finish.",
      build: "MODE: BUILD. Implement the request end to end. Read what you need, make focused edits, then call check_code. If it reports problems, fix them and check again. Repeat until clean AND the task is genuinely complete, then call finish.",
      debug: "MODE: DEBUG. Find and fix real bugs and problems that are likely to happen — not speculative low-probability ones. Fix, run check_code, repeat until clean, then call finish explaining each root cause.",
      improve: "MODE: IMPROVE. Improve the codebase: sensible new features, simpler and faster code, less duplication, hardened weak spots. Make a coherent set of changes, run check_code until clean, then call finish.",
    };

    const system = [
      "You are Coderbot, an autonomous coding agent running inside GitHub Actions in the repo " + sel!.owner + "/" + sel!.name + ".",
      "Working branch: " + sel!.working_branch + ".",
      "You have shell access and tools to list, read, search, write, edit and delete files, plus check_code to verify your work and update_plan to keep the user informed.",
      "Never claim you changed a file unless a write tool actually succeeded. Read files before editing them and prefer edit_file for small changes.",
      "Call update_plan early with the steps you intend to take, and keep it current as you go.",
      "When the task is complete and check_code is clean, call `finish` with a short user-facing summary and a conventional-style commit message.",
      "Do NOT run installers or other long-running commands unless required. Do NOT commit — the runner commits and pushes for you.",
      MODE_PROMPTS[mode],
    ].join(" ");

    return Response.json({
      job_type: job.job_type,
      mode,
      task_id: job.task_id ?? job.id,
      checkpoint: job.checkpoint ?? null,
      prompt: job.prompt,
      model: job.model,
      openrouter_key: or?.api_key ?? null,
      mistral_key: or.mistral_api_key,
      groq_key: or.groq_api_key,
      nvidia_key: or.nvidia_api_key,
      embedding_provider: or.embedding_provider,
      embedding_model: or.embedding_model,
      embedding_key: embeddingKey,
      system,
      messages,
      repo: { owner: sel!.owner, name: sel!.name },
      working_branch: sel!.working_branch,
    });
  } } },
});
