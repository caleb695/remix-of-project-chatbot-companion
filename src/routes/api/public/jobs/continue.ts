import { createFileRoute } from "@tanstack/react-router";
import { authJobRequest } from "@/lib/job-auth.server";
import { ghFetch } from "@/lib/github.server";

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
    try {
      await ghFetch(`/repos/${sel.owner}/${sel.name}/dispatches`, conn.access_token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "lovable-coding-job",
          client_payload: {
            job_id: next.id,
            job_secret: secret,
            app_url: origin,
            // Continuations check out the review branch so the work in progress
            // is there; the merge target stays the user's working branch.
            working_branch: body.review_branch || job.working_branch || sel.working_branch,
          },
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await sb.from("coding_jobs")
        .update({ status: "failed", error: `continuation dispatch: ${msg.slice(0, 300)}` })
        .eq("id", next.id);
      return new Response(`dispatch failed: ${msg.slice(0, 120)}`, { status: 502 });
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
