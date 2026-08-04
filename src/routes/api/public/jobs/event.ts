import { createFileRoute } from "@tanstack/react-router";
import { authJobRequest } from "@/lib/job-auth.server";

/** The runner reports its thoughts and actions here so the app can show live activity. */
export const Route = createFileRoute("/api/public/jobs/event")({
  server: { handlers: { POST: async ({ request }) => {
    let ctx; try { ctx = await authJobRequest(request); } catch (r) { return r as Response; }
    const { job, sb } = ctx;
    if (!job.thread_id) return Response.json({ ok: true });
    const body = (await request.json().catch(() => ({}))) as {
      kind?: string; text?: string; phase?: string; agent_id?: string; agent_label?: string;
    };
    const kind = ["thought", "action", "status", "error"].includes(body.kind ?? "") ? body.kind! : "status";
    await sb.from("agent_events").insert({
      user_id: job.user_id,
      thread_id: job.thread_id,
      task_id: job.task_id ?? job.id,
      agent_id: body.agent_id || "main",
      agent_label: body.agent_label || "Main agent",
      phase: (body.phase || "coding").slice(0, 32),
      kind,
      text: String(body.text ?? "").slice(0, 4000),
    });
    return Response.json({ ok: true });
  } } },
});
