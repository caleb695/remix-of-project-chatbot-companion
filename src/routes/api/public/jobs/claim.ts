import { createFileRoute } from "@tanstack/react-router";
import { authJobRequest } from "@/lib/job-auth.server";

export const Route = createFileRoute("/api/public/jobs/claim")({
  server: { handlers: { POST: async ({ request }) => {
    let ctx;
    try { ctx = await authJobRequest(request); } catch (r) { return r as Response; }
    const { job, sb } = ctx;

    // Load thread messages, openrouter key, gh token
    const [{ data: msgs }, { data: or }, { data: gh }, { data: sel }] = await Promise.all([
      sb.from("chat_messages").select("role, parts").eq("thread_id", job.thread_id).order("created_at"),
      sb.from("openrouter_settings").select("api_key").eq("user_id", job.user_id).maybeSingle(),
      sb.from("github_connections").select("access_token").eq("user_id", job.user_id).maybeSingle(),
      sb.from("repo_selections").select("owner, name, working_branch").eq("id", job.repo_selection_id).single(),
    ]);
    if (!or?.api_key) return new Response("no openrouter key", { status: 400 });
    if (!gh?.access_token) return new Response("no github token", { status: 400 });

    // Mark running
    await sb.from("coding_jobs").update({ status: "running", updated_at: new Date().toISOString() }).eq("id", job.id);

    const partsText = (parts: unknown) => {
      if (!Array.isArray(parts)) return "";
      return parts.map((p: { type?: string; text?: string }) => p?.type === "text" ? (p.text ?? "") : "").join("");
    };
    const messages = (msgs ?? []).map((m) => ({ role: m.role, content: partsText(m.parts) }));
    // Append the fresh coding-job prompt as a final user turn
    messages.push({ role: "user", content: job.prompt });

    const system = [
      "You are Lovable Coder, running inside GitHub Actions in the repo " + sel!.owner + "/" + sel!.name + ".",
      "Working branch: " + sel!.working_branch + ".",
      "You have shell access and tools to read/list/write/delete files.",
      "Make focused edits. When done, call the `finish` tool with a short summary and a conventional-style commit message.",
      "Do NOT run installers or long-running commands unless required. Do NOT commit — the runner will commit and push.",
    ].join(" ");

    return Response.json({
      prompt: job.prompt,
      model: job.model,
      openrouter_key: or.api_key,
      system,
      messages,
      repo: { owner: sel!.owner, name: sel!.name },
      working_branch: sel!.working_branch,
    });
  } } },
});
