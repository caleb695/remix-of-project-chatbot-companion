import { createFileRoute } from "@tanstack/react-router";
import { authJobRequest } from "@/lib/job-auth.server";

export const Route = createFileRoute("/api/public/jobs/checkpoint")({
  server: { handlers: { POST: async ({ request }) => {
    let ctx; try { ctx = await authJobRequest(request); } catch (r) { return r as Response; }
    const { job, sb } = ctx;
    const body = await request.json().catch(() => ({}));
    await sb.from("coding_jobs").update({
      status: "checkpointed",
      checkpoint: (body as { checkpoint?: unknown }).checkpoint ?? {},
      updated_at: new Date().toISOString(),
    }).eq("id", job.id);
    return Response.json({ ok: true });
  } } },
});
