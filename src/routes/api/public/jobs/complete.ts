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
    await sb.from("coding_jobs").update({
      status,
      commit_sha: body.commit_sha ?? null,
      error: body.error ?? null,
      hmac_secret: null, // invalidate
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", job.id);
    // Append summary as an assistant message in the thread
    if (body.summary) {
      await sb.from("chat_messages").insert({
        thread_id: job.thread_id,
        user_id: job.user_id,
        role: "assistant",
        parts: [{ type: "text", text: (status === "completed" ? "✅ " : "❌ ") + body.summary + (body.commit_sha ? `\n\nCommit: \`${body.commit_sha.slice(0, 7)}\`` : "") }],
      });
    }
    return Response.json({ ok: true });
  } } },
});
