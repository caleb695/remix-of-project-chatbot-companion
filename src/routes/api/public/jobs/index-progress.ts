import { createFileRoute } from "@tanstack/react-router";
import { authJobRequest } from "@/lib/job-auth.server";

export const Route = createFileRoute("/api/public/jobs/index-progress")({
  server: { handlers: { POST: async ({ request }) => {
    let ctx; try { ctx = await authJobRequest(request); } catch (r) { return r as Response; }
    const { job, sb } = ctx;
    const body = (await request.json().catch(() => ({}))) as { current?: number; total?: number };
    await sb.from("coding_jobs").update({
      progress_current: Math.max(0, Math.floor(body.current ?? 0)),
      progress_total: Math.max(0, Math.floor(body.total ?? 0)),
      updated_at: new Date().toISOString(),
    }).eq("id", job.id);
    return Response.json({ ok: true });
  } } },
});