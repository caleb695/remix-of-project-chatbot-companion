import { createFileRoute } from "@tanstack/react-router";
import { authJobRequest } from "@/lib/job-auth.server";

export const Route = createFileRoute("/api/public/jobs/claim")({
  server: { handlers: { POST: async ({ request }) => {
    let ctx;
    try { ctx = await authJobRequest(request); } catch (r) { return r as Response; }
    const { job, sb } = ctx;

    // Load thread messages, openrouter key, gh token
    const isIndex = job.job_type === "index";
    const [{ data: msgs }, { data: or }, { data: gh }, { data: sel }, { data: thr }, { data: atts }] = await Promise.all([
      isIndex
        ? Promise.resolve({ data: [] as { role: string; parts: unknown }[] })
        : sb.from("chat_messages").select("role, parts").eq("thread_id", job.thread_id!).order("created_at"),
      sb.from("openrouter_settings")
        .select("api_key, mistral_api_key, groq_api_key, nvidia_api_key, embedding_provider, embedding_model")
        .eq("user_id", job.user_id).maybeSingle(),
      sb.from("github_connections").select("access_token").eq("user_id", job.user_id).maybeSingle(),
      sb.from("repo_selections").select("owner, name, working_branch").eq("id", job.repo_selection_id).single(),
      isIndex || !job.thread_id
        ? Promise.resolve({ data: null as { sub_agents: unknown; seed_summary: string | null } | null })
        : sb.from("chat_threads").select("sub_agents, seed_summary").eq("id", job.thread_id).maybeSingle(),
      isIndex || !job.thread_id
        ? Promise.resolve({ data: [] as Array<{ name: string; mime_type: string | null; storage_path: string; code_only: boolean }> })
        : sb.from("chat_attachments").select("name, mime_type, storage_path, code_only").eq("thread_id", job.thread_id),
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

    // Sub-agents configured for this chat.
    type SubAgent = { id: string; label: string; model: string; instructions?: string };
    const rawSubs = Array.isArray(thr?.sub_agents) ? (thr!.sub_agents as SubAgent[]) : [];
    const sub_agents = rawSubs
      .filter((a) => a && a.id && a.model)
      .map((a) => ({ id: a.id, label: a.label || a.id, model: a.model, instructions: a.instructions ?? "" }));

    const { data: referenceRepos } = await sb
      .from("repo_selections")
      .select("owner, name, indexed_at")
      .eq("user_id", job.user_id)
      .neq("id", job.repo_selection_id)
      .order("owner");

    // Signed URLs so the runner can pull uploaded files into the checkout.
    const attachments: Array<{ name: string; mime_type: string | null; code_only: boolean; url: string }> = [];
    for (const a of atts ?? []) {
      const { data: signed } = await sb.storage.from("attachments").createSignedUrl(a.storage_path, 60 * 60 * 6);
      if (signed?.signedUrl) {
        attachments.push({ name: a.name, mime_type: a.mime_type, code_only: a.code_only, url: signed.signedUrl });
      }
    }

    const system = [
      "You are Coderbot, an autonomous coding agent running inside GitHub Actions in the repo " + sel!.owner + "/" + sel!.name + ".",
      "Working branch: " + sel!.working_branch + ".",
      "You have shell access and tools to list, read, search, write, edit and delete files, plus check_code to verify your work and update_plan to keep the user informed. You also have read-only reference-repo tools for other connected GitHub repos; use them when the user asks you to copy or adapt code from another repo, but only write changes to the current repo.",
      "Work in as few model turns as possible: put EVERY independent tool call you need for a step into the SAME turn (reads, globs and searches all run in parallel), batch file reads with read_files, and use multi_edit for several edits at once instead of one call per edit. Never spend a turn on a single trivial read when you could have asked for five.",
      "Never claim you changed a file unless a write tool actually succeeded. Read files before editing them and prefer edit_file for small changes.",
      "Call update_plan early with the steps you intend to take, and keep it current as you go.",
      "Use search_web to look up current docs, package versions, APIs or fixes when you are not sure, instead of guessing — but prefer the repo's own code when the answer lives there.",
      "When the task is complete and check_code is clean, call `finish`. The summary is shown to the user as your chat reply: state what you built, then list every file you changed with a one-line description of the change (and which agent made it). Also give a conventional-style commit message.",
      "You never land code on the user's branch. The runner pushes your work to a temporary review branch and the user approves the merge in the app, so make the summary complete enough to review from.",
      "Do NOT run installers or other long-running commands unless required. Do NOT run git commit or git push yourself — the runner handles that.",
      sub_agents.length
        ? "You have " + sub_agents.length + " sub-agent(s) that run in parallel on this same checkout: " +
          sub_agents.map((a) => `${a.id} (${a.label})${a.instructions ? " — scope: " + a.instructions : ""}`).join("; ") +
          ". Divide the work into " + (sub_agents.length + 1) + " roughly equal shares — one per sub-agent plus one for yourself — and issue all delegate calls for a round in the SAME turn. Each assignment must be a substantial workstream described in at least a paragraph (goal, the files it owns, what to implement, how to verify), never a single small errand. When a round of sub-agents reports back, immediately delegate the next comparable chunk to each of them if meaningful work remains; only stop delegating when what is left is too small to be worth splitting. Never give two sub-agents the same file, and report what each sub-agent did in your final summary."
        : "",
      referenceRepos?.length
        ? "Read-only reference repos available for copying/adapting code snippets: " +
          referenceRepos.map((r) => `${r.owner}/${r.name}${r.indexed_at ? "" : " (sync/index may be stale or empty)"}`).join(", ") +
          ". Use list_reference_files, read_reference_file, and search_reference_code to inspect them. Do not edit reference repos."
        : "",
      attachments.length
        ? "The user uploaded files; the runner placed them in the `uploads/` folder of the checkout: " +
          attachments.map((a) => `uploads/${a.name}${a.code_only ? " (asset only — use it from code, its contents are not shown to you)" : ""}`).join(", ") + "."
        : "",
      thr?.seed_summary
        ? "Context carried over from the user's previous chat (summary): " + thr.seed_summary
        : "",
      MODE_PROMPTS[mode],
    ].filter(Boolean).join(" ");

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
      sub_agents,
      attachments,
    });
  } } },
});
