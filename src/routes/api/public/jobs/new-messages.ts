import { createFileRoute } from "@tanstack/react-router";
import { authJobRequest } from "@/lib/job-auth.server";

/**
 * Called by the runner during long-running sessions (debug/improve modes) to
 * check if the user has sent any new messages while the AI is working.
 */
export const Route = createFileRoute("/api/public/jobs/new-messages")({
  server: { handlers: { POST: async ({ request }) => {
    let ctx; try { ctx = await authJobRequest(request); } catch (r) { return r as Response; }
    const { job, sb } = ctx;
    const body = (await request.json().catch(() => ({}))) as { lastMessageCount?: number };
    const lastMessageCount = body.lastMessageCount ?? 0;

    if (!job.thread_id) {
      return Response.json({ newMessages: [] });
    }

    // Fetch all user messages from the thread
    const { data: allMessages } = await sb
      .from("chat_messages")
      .select("role, parts, created_at")
      .eq("thread_id", job.thread_id)
      .eq("role", "user")
      .order("created_at", { ascending: true });

    if (!allMessages || allMessages.length === 0) {
      return Response.json({ newMessages: [] });
    }

    // Parse message content from parts
    const parseContent = (parts: unknown): string => {
      if (!Array.isArray(parts)) return "";
      return parts.map((p: { type?: string; text?: string }) => p?.type === "text" ? (p.text ?? "") : "").join("");
    };

    const allUserMessages = allMessages.map((m) => ({
      content: parseContent(m.parts),
      created_at: m.created_at,
    }));

    // Return only messages newer than what the runner has seen
    // The runner tracks count, so we return messages beyond that count
    const newMessages = allUserMessages.slice(lastMessageCount);

    return Response.json({ newMessages });
  } } },
});
