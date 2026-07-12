import { createFileRoute } from "@tanstack/react-router";
import { authJobRequest } from "@/lib/job-auth.server";

export const Route = createFileRoute("/api/public/jobs/log")({
  server: { handlers: { POST: async ({ request }) => {
    let ctx; try { ctx = await authJobRequest(request); } catch (r) { return r as Response; }
    const { job, sb } = ctx;
    const body = await request.json().catch(() => ({}));
    const line = String((body as { line?: unknown }).line ?? "").slice(0, 2000);
    const next = (job.logs ?? "") + (job.logs ? "\n" : "") + `[${new Date().toISOString().slice(11, 19)}] ${line}`;
    // cap logs at ~200KB
    const trimmed = next.length > 200_000 ? next.slice(-200_000) : next;
    await sb.from("coding_jobs").update({ logs: trimmed, updated_at: new Date().toISOString() }).eq("id", job.id);
    return Response.json({ ok: true });
  } } },
});
