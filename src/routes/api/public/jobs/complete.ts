import { createFileRoute } from "@tanstack/react-router";
import { authJobRequest } from "@/lib/job-auth.server";

export const Route = createFileRoute("/api/public/jobs/complete")({
  server: { handlers: { POST: async ({ request }) => {
    let ctx; try { ctx = await authJobRequest(request); } catch (r) { return r as Response; }
    const { job, sb } = ctx;
    const body = (await request.json().catch(() => ({}))) as {
      status?: "completed" | "failed"; summary?: string; commit_sha?: string; error?: string;
    };
    const status = body.status === "failed" ? "failed" : "completed";
    // Persist the transcript before invalidating the runner secret. Using the
    // job id makes completion idempotent when GitHub retries this request.
    if (job.thread_id) {
      const text = status === "completed"
        ? body.summary || "The GitHub Actions run completed."
        : body.summary || body.error || "The GitHub Actions run failed.";
      const { error: messageError } = await sb.from("chat_messages").upsert({
        id: job.id,
        thread_id: job.thread_id,
        user_id: job.user_id,
        role: "assistant",
        parts: [{
          type: "text",
          text: (status === "completed" ? "✅ " : "❌ ") + text
            + (body.commit_sha ? `\n\nCommit: \`${body.commit_sha.slice(0, 7)}\`` : ""),
        }],
      });
      if (messageError) {
        return Response.json({ error: `could not save chat result: ${messageError.message}` }, { status: 500 });
      }
    }

    const { error: updateError } = await sb.from("coding_jobs").update({
      status,
      commit_sha: body.commit_sha ?? null,
      error: body.error ?? null,
      hmac_secret: null, // invalidate
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
