import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage, type ChatTransport, type HttpChatTransportInitOptions } from "ai";
import { supabase } from "@/integrations/supabase/client";

/**
 * Custom transport that disables reconnection. Our architecture doesn't maintain
 * persistent server-side streams (each POST creates a new stream), so reconnection
 * via GET /api/chat/{chatId}/stream doesn't work. Instead, we rely on background
 * polling of messages/agent_events to sync state when the user returns.
 */
class NoReconnectTransport extends DefaultChatTransport {
  constructor(options?: HttpChatTransportInitOptions<UIMessage>) {
    super(options);
  }

  // Disable reconnection - return null to signal "nothing to reconnect to"
  async reconnectToStream() {
    return null;
  }
}

/**
 * Chat instances live outside React so an in-flight run keeps streaming when the
 * user navigates away from the chat tab (e.g. to Account) and back.
 */
const chats = new Map<string, Chat<UIMessage>>();

export function getThreadChat(threadId: string, repoId: string, initial: UIMessage[]) {
  const key = `${threadId}:${repoId}`;
  let chat = chats.get(key);
  if (!chat) {
    chat = new Chat<UIMessage>({
      id: threadId,
      messages: initial,
      transport: new NoReconnectTransport({
        api: "/api/chat",
        fetch: async (input, init) => {
          const { data } = await supabase.auth.getSession();
          const headers = new Headers(init?.headers);
          if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
          return fetch(input, { ...init, headers });
        },
        body: { threadId, repoId },
      }),
    });
    chats.set(key, chat);
  }
  return chat;
}

export function disposeThreadChat(threadId: string) {
  for (const key of [...chats.keys()]) {
    if (key.startsWith(`${threadId}:`)) chats.delete(key);
  }
}

/** Run bookkeeping (active job / task id) that must also survive tab switches. */
const runState = new Map<string, { taskId: string | null; jobId: string | null }>();

export function getRunState(threadId: string) {
  return runState.get(threadId) ?? { taskId: null, jobId: null };
}

export function setRunState(threadId: string, patch: { taskId?: string | null; jobId?: string | null }) {
  const current = getRunState(threadId);
  runState.set(threadId, { ...current, ...patch });
}
