import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getThreadMessages } from "@/lib/threads.functions";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, FileText, FilePlus, FileMinus, FileSearch, List } from "lucide-react";

export const Route = createFileRoute("/_authenticated/repos/$repoId/threads/$threadId")({
  component: ChatPage,
});

function ChatPage() {
  const { repoId, threadId } = useParams({ from: "/_authenticated/repos/$repoId/threads/$threadId" });
  const getMsgs = useServerFn(getThreadMessages);
  const initial = useQuery({
    queryKey: ["messages", threadId],
    queryFn: () => getMsgs({ data: { threadId } }),
  });

  if (initial.isLoading) return <div className="grid flex-1 place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (initial.error) return <div className="p-4 text-sm text-destructive">{(initial.error as Error).message}</div>;

  return <Chat key={threadId} threadId={threadId} repoId={repoId} initial={(initial.data ?? []) as UIMessage[]} />;
}

function Chat({ threadId, repoId, initial }: { threadId: string; repoId: string; initial: UIMessage[] }) {
  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/chat",
    fetch: async (input, init) => {
      const { data } = await supabase.auth.getSession();
      const headers = new Headers(init?.headers);
      if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
      return fetch(input, { ...init, headers });
    },
    body: { threadId, repoId },
  }), [threadId, repoId]);

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initial,
    transport,
  });

  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => { inputRef.current?.focus(); }, [threadId, status]);

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollerRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="pt-16 text-center text-sm text-muted-foreground">
              Ask the AI to explore, refactor, or add a feature to your project.
            </div>
          )}
          {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> thinking…
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error.message}</p>}
        </div>
      </div>
      <form
        className="border-t border-border/60 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || busy) return;
          sendMessage({ text: input.trim() });
          setInput("");
        }}
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() && !busy) {
                  sendMessage({ text: input.trim() });
                  setInput("");
                }
              }
            }}
            placeholder="Message coderbot…"
            className="min-h-[52px] resize-none"
          />
          <Button type="submit" size="icon" disabled={busy || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-lg px-4 py-3 ${isUser ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return <div key={i} className="whitespace-pre-wrap text-sm">{part.text}</div>;
          }
          if (part.type.startsWith("tool-")) {
            return <ToolCall key={i} part={part as { type: string; toolName?: string; input?: unknown; state?: string }} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

function ToolCall({ part }: { part: { type: string; toolName?: string; input?: unknown; state?: string } }) {
  const name = part.type.replace(/^tool-/, "") || part.toolName || "tool";
  const input = part.input as Record<string, unknown> | undefined;
  const meta = TOOLS[name] ?? { icon: FileText, label: name };
  const Icon = meta.icon;
  const detail =
    name === "read_file" || name === "write_file" || name === "delete_file"
      ? String(input?.path ?? "")
      : "";
  return (
    <div className="my-2 flex items-center gap-2 rounded border border-border bg-background/40 px-2 py-1 font-mono text-[11px] text-muted-foreground">
      <Icon className="h-3 w-3" />
      <span className="text-foreground">{meta.label}</span>
      {detail && <span className="truncate">{detail}</span>}
    </div>
  );
}

const TOOLS: Record<string, { icon: typeof FileText; label: string }> = {
  list_files: { icon: List, label: "list files" },
  read_file: { icon: FileSearch, label: "read" },
  write_file: { icon: FilePlus, label: "write" },
  delete_file: { icon: FileMinus, label: "delete" },
};