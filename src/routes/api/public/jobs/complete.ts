import { createFileRoute } from "@tanstack/react-router";
import { authJobRequest } from "@/lib/job-auth.server";

type ChangedFile = { path: string; status: string };

export const Route = createFileRoute("/api/public/jobs/complete")({
  server: { handlers: { POST: async ({ request }) => {
    let ctx; try { ctx = await authJobRequest(request); } catch (r) { return r as Response; }
    const { job, sb } = ctx;
    const body = (await request.json().catch(() => ({}))) as {
      status?: "completed" | "failed" | "awaiting_review";
      summary?: string; commit_sha?: string; error?: string;
      review_branch?: string; base_branch?: string;
      changed_files?: ChangedFile[]; diff?: string;
    };
    const status = body.status === "failed" ? "failed"
      : body.status === "awaiting_review" ? "awaiting_review"
      : "completed";
    const changed = Array.isArray(body.changed_files) ? body.changed_files.slice(0, 500) : [];

    // Persist the transcript before invalidating the runner secret. Using the
    // job id makes completion idempotent when GitHub retries this request.
    if (job.thread_id) {
      const text = status === "failed"
        ? body.summary || body.error || "The GitHub Actions run failed."
        : body.summary || "The GitHub Actions run completed.";
      const prefix = status === "failed" ? "❌ " : status === "awaiting_review" ? "🧪 " : "✅ ";
      // A durable `data-run` part means the review card, the file list and the
      // activity log are all still there after the tab (or device) is closed.
      const parts: unknown[] = [{ type: "text", text: prefix + text }];
      parts.push({
        type: "data-run",
        data: {
          jobId: job.id,
          taskId: job.task_id ?? job.id,
          status,
          reviewBranch: body.review_branch ?? null,
          baseBranch: body.base_branch ?? job.working_branch ?? null,
          commitSha: body.commit_sha ?? null,
          files: changed,
        },
      });
      const { error: messageError } = await sb.from("chat_messages").upsert({
        id: job.id,
        thread_id: job.thread_id,
        user_id: job.user_id,
        role: "assistant",
        parts: parts as never,
      });
      if (messageError) {
        return Response.json({ error: `could not save chat result: ${messageError.message}` }, { status: 500 });
      }
    }

    const { error: updateError } = await sb.from("coding_jobs").update({
      status,
      commit_sha: body.commit_sha ?? null,
      error: body.error ?? null,
      summary: body.summary ?? null,
      review_branch: body.review_branch ?? null,
      changed_files: changed as never,
      diff: (body.diff ? { patch: body.diff.slice(0, 400000) } : {}) as never,
      // Approval still needs a live runner secret? No — the app merges through
      // the user's GitHub token, so the runner secret is always invalidated.
      hmac_secret: null,
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", job.id);
    if (updateError) {
      return Response.json({ error: `could not finish job: ${updateError.message}` }, { status: 500 });
    }
    // Mark repo indexed_at on successful index jobs
    if (status === "completed" && job.job_type === "index") {
      await sb.from("repo_selections").update({ indexed_at: new Date().toISOString() }).eq("id", job.repo_selection_id);
    }
    return Response.json({ ok: true });
  } } },
});
