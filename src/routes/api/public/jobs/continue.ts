import { createFileRoute } from "@tanstack/react-router";
import { authJobRequest } from "@/lib/job-auth.server";

/**
 * Called by the runner just before the 6h GitHub Actions limit. Stores the
 * checkpoint, then dispatches a fresh run that picks the task back up.
 */
export const Route = createFileRoute("/api/public/jobs/continue")({
  server: { handlers: { POST: async ({ request }) => {
    let ctx; try { ctx = await authJobRequest(request); } catch (r) { return r as Response; }
    const { job, sb } = ctx;
    const body = (await request.json().catch(() => ({}))) as { checkpoint?: unknown; review_branch?: string };

    const { data: sel } = await sb
      .from("repo_selections").select("owner, name, working_branch").eq("id", job.repo_selection_id).single();
    const { data: conn } = await sb
      .from("github_connections").select("access_token").eq("user_id", job.user_id).maybeSingle();
    if (!sel || !conn?.access_token) return new Response("cannot continue: missing repo or GitHub token", { status: 400 });

    const secret = crypto.randomUUID() + crypto.randomUUID();
    const { data: next, error } = await sb.from("coding_jobs").insert({
      user_id: job.user_id,
      thread_id: job.thread_id,
      repo_selection_id: job.repo_selection_id,
      status: "queued",
      prompt: job.prompt,
      model: job.model,
      mode: job.mode,
      task_id: job.task_id ?? job.id,
      job_type: job.job_type,
      hmac_secret: secret,
      working_branch: job.working_branch,
      continue_of: job.id,
      checkpoint: (body.checkpoint ?? {}) as never,
      logs: "",
    }).select("id").single();
    if (error) return new Response(`could not queue continuation: ${error.message}`, { status: 500 });

    const origin = new URL(request.url).origin;
    const dispatch = await fetch(`https://api.github.com/repos/${sel.owner}/${sel.name}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${conn.access_token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "coderbot-app",
      },
      body: JSON.stringify({
        event_type: "lovable-coding-job",
        client_payload: {
          job_id: next.id,
          job_secret: secret,
          app_url: origin,
          working_branch: job.working_branch ?? sel.working_branch,
        },
      }),
    });
    if (!dispatch.ok) {
      const text = await dispatch.text();
      await sb.from("coding_jobs")
        .update({ status: "failed", error: `continuation dispatch ${dispatch.status}: ${text.slice(0, 300)}` })
        .eq("id", next.id);
      return new Response(`dispatch failed ${dispatch.status}`, { status: 502 });
    }

    await sb.from("coding_jobs").update({
      status: "checkpointed",
      finished_at: new Date().toISOString(),
      hmac_secret: null,
      updated_at: new Date().toISOString(),
    }).eq("id", job.id);

    return Response.json({ ok: true, job_id: next.id });
  } } },
});
