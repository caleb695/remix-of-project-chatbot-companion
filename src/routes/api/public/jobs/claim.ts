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
    if (!isIndex) {
      // Append the fresh coding-job prompt as a final user turn
      messages.push({ role: "user", content: job.prompt });
    }

    const system = [
      "You are Lovable Coder, running inside GitHub Actions in the repo " + sel!.owner + "/" + sel!.name + ".",
      "Working branch: " + sel!.working_branch + ".",
      "You have shell access and tools to read/list/write/delete files.",
      "Make focused edits. When done, call the `finish` tool with a short summary and a conventional-style commit message.",
      "Do NOT run installers or long-running commands unless required. Do NOT commit — the runner will commit and push.",
    ].join(" ");

    return Response.json({
      job_type: job.job_type,
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
