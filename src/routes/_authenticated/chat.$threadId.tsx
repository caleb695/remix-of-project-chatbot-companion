import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Menu, Send, Loader2, Plus, Trash2, MessageSquare, Search, ChevronDown, X, Github, Zap, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getThreadMessages, listThreads, createThread, deleteThread, getThread, updateThread } from "@/lib/threads.functions";
import { listRepoSelections } from "@/lib/github.functions";
import { listOpenrouterModels, getOpenrouterSettings } from "@/lib/openrouter.functions";
import { enqueueCodingJob, listJobsForThread, getJob, cancelJob } from "@/lib/jobs.functions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = useParams({ from: "/_authenticated/chat/$threadId" });
  const getMsgs = useServerFn(getThreadMessages);
  const getThreadFn = useServerFn(getThread);

  const initial = useQuery({ queryKey: ["messages", threadId], queryFn: () => getMsgs({ data: { threadId } }) });
  const thread = useQuery({ queryKey: ["thread", threadId], queryFn: () => getThreadFn({ data: { id: threadId } }) });

  if (initial.isLoading || thread.isLoading) {
    return <div className="grid h-full place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!thread.data) {
    return <div className="p-6 text-sm text-muted-foreground">Thread not found.</div>;
  }

  return (
    <ChatView
      key={threadId}
      threadId={threadId}
      initial={(initial.data ?? []) as UIMessage[]}
      thread={thread.data}
    />
  );
}

type ThreadData = {
  id: string;
  title: string;
  model: string | null;
  repo_selection_id: string;
  repo_selections: { owner: string; name: string; working_branch: string; workflow_installed_at?: string | null } | null;
};

function ChatView({ threadId, initial, thread }: { threadId: string; initial: UIMessage[]; thread: ThreadData }) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateThread);
  const model = thread.model ?? "";
  const repoId = thread.repo_selection_id;

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

  const { messages, sendMessage, status, error } = useChat({ id: threadId, messages: initial, transport });
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" }); }, [messages, status]);
  useEffect(() => { inputRef.current?.focus(); }, [threadId]);

  const busy = status === "submitted" || status === "streaming";

  const enqueueFn = useServerFn(enqueueCodingJob);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const runMut = useMutation({
    mutationFn: (prompt: string) => enqueueFn({ data: { threadId, prompt } }),
    onSuccess: (r) => { setActiveJobId(r.jobId); setInput(""); qc.invalidateQueries({ queryKey: ["jobs", threadId] }); toast.success("Coding job started on GitHub Actions"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setModel = useMutation({
    mutationFn: (m: string) => updateFn({ data: { id: threadId, model: m } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["thread", threadId] }),
  });
  const setRepo = useMutation({
    mutationFn: (id: string) => updateFn({ data: { id: threadId, repo_selection_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["thread", threadId] }),
  });

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
        <ThreadsSidebarTrigger activeId={threadId} />
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-sm font-medium">{thread.title}</div>
          <RepoPill thread={thread} onChange={(id) => setRepo.mutate(id)} />
        </div>
        <div className="w-9" />
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="pt-12 text-center text-sm text-muted-foreground">
              Ask about {thread.repo_selections?.owner}/{thread.repo_selections?.name}.
            </div>
          )}
          {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> thinking…
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          <JobsPanel threadId={threadId} activeJobId={activeJobId} onClear={() => setActiveJobId(null)} repo={thread.repo_selections} />
        </div>
      </div>

      <form
        className="border-t border-border/60 bg-background p-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || busy) return;
          sendMessage({ text: input.trim() });
          setInput("");
        }}
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <ModelPicker current={model} onSelect={(m) => setModel.mutate(m)} />
          <Textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() && !busy) { sendMessage({ text: input.trim() }); setInput(""); }
              }
            }}
            placeholder="Message…"
            className="min-h-[44px] max-h-40 resize-none"
          />
          <Button
            type="button" size="icon" variant="secondary" className="shrink-0"
            title="Run coding job on GitHub Actions"
            disabled={runMut.isPending || !input.trim() || !thread.repo_selections?.workflow_installed_at}
            onClick={() => runMut.mutate(input.trim())}
          >
            {runMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          </Button>
          <Button type="submit" size="icon" disabled={busy || !input.trim()} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!thread.repo_selections?.workflow_installed_at && (
          <p className="mx-auto mt-1 max-w-3xl text-center text-[10px] text-muted-foreground">
            Install the coder workflow on this repo (Account tab) to enable the ⚡ coding job button.
          </p>
        )}
      </form>
    </div>
  );
}

function JobsPanel({ threadId, activeJobId, onClear, repo }: {
  threadId: string;
  activeJobId: string | null;
  onClear: () => void;
  repo: { owner: string; name: string } | null;
}) {
  const listFn = useServerFn(listJobsForThread);
  const getFn = useServerFn(getJob);
  const cancelFn = useServerFn(cancelJob);
  const qc = useQueryClient();
  const jobs = useQuery({
    queryKey: ["jobs", threadId],
    queryFn: () => listFn({ data: { threadId } }),
    refetchInterval: 4000,
  });
  const active = jobs.data?.find((j) => j.id === activeJobId)
    ?? jobs.data?.find((j) => j.status === "running" || j.status === "queued");
  const detail = useQuery({
    queryKey: ["job", active?.id],
    queryFn: () => getFn({ data: { id: active!.id } }),
    enabled: !!active,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "completed" || s === "failed" ? false : 2500;
    },
  });
  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs", threadId] }),
  });

  if (!active) return null;
  const d = detail.data ?? active;
  const running = d.status === "queued" || d.status === "running";

  return (
    <div className="rounded-lg border border-border bg-card p-3 text-xs">
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium">Coding job · {d.status}</span>
        {repo && (
          <a
            href={`https://github.com/${repo.owner}/${repo.name}/actions`}
            target="_blank" rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            Actions <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="mt-1 truncate text-muted-foreground">{d.prompt}</div>
      {"logs" in d && d.logs && (
        <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-muted/50 p-2 font-mono text-[10px] text-muted-foreground">{d.logs}</pre>
      )}
      {d.error && <p className="mt-2 text-destructive">{d.error}</p>}
      <div className="mt-2 flex gap-2">
        {running && (
          <Button size="sm" variant="outline" onClick={() => cancelMut.mutate(d.id)}>Cancel</Button>
        )}
        {!running && (
          <Button size="sm" variant="ghost" onClick={onClear}>Dismiss</Button>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground"
            : "max-w-[90%] text-foreground"
        }
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") return <div key={i} className="whitespace-pre-wrap text-sm">{part.text}</div>;
          if (part.type.startsWith("tool-")) {
            const p = part as { type: string; input?: unknown };
            const name = p.type.replace(/^tool-/, "");
            const path = (p.input as { path?: string } | undefined)?.path ?? "";
            return (
              <div key={i} className="my-1 inline-flex items-center gap-1.5 rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                <span className="text-foreground">{name}</span>
                {path && <span className="truncate max-w-[200px]">{path}</span>}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

function RepoPill({ thread, onChange }: { thread: ThreadData; onChange: (id: string) => void }) {
  const reposFn = useServerFn(listRepoSelections);
  const [open, setOpen] = useState(false);
  const repos = useQuery({ queryKey: ["repo_selections"], queryFn: () => reposFn(), enabled: open });
  const label = thread.repo_selections ? `${thread.repo_selections.owner}/${thread.repo_selections.name}` : "no repo";
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="mx-auto mt-0.5 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground">
          <Github className="h-3 w-3" />
          <span className="max-w-[180px] truncate">{label}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[70vh]">
        <SheetHeader><SheetTitle>Repo for this chat</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-1 overflow-y-auto">
          {repos.isLoading && <Loader2 className="mx-auto h-4 w-4 animate-spin" />}
          {(repos.data ?? []).map((r) => (
            <button
              key={r.id}
              onClick={() => { onChange(r.id); setOpen(false); }}
              className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-accent ${
                r.id === thread.repo_selection_id ? "bg-accent" : ""
              }`}
            >
              <span className="font-mono">{r.owner}/{r.name}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ModelPicker({ current, onSelect }: { current: string; onSelect: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const modelsFn = useServerFn(listOpenrouterModels);
  const settingsFn = useServerFn(getOpenrouterSettings);
  const settings = useQuery({ queryKey: ["or_settings"], queryFn: () => settingsFn(), enabled: open });
  const hasKey = settings.data?.has_key ?? false;
  const models = useQuery({
    queryKey: ["or_models"],
    queryFn: () => modelsFn(),
    enabled: open && hasKey,
  });

  const isFreeQuery = q.toLowerCase().includes("free");
  const stripped = q.replace(/free/gi, "").trim().toLowerCase();

  const filtered = (models.data ?? []).filter((m) => {
    const priceFree =
      (!m.pricing?.prompt || parseFloat(m.pricing.prompt) === 0) &&
      (!m.pricing?.completion || parseFloat(m.pricing.completion) === 0);
    if (isFreeQuery && !priceFree) return false;
    if (!stripped) return true;
    return `${m.id} ${m.name}`.toLowerCase().includes(stripped);
  });

  const short = current ? current.split("/").pop() ?? current : "model";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex h-11 shrink-0 items-center gap-1 rounded-md border border-border bg-card px-2 text-xs font-mono text-muted-foreground hover:text-foreground"
          title={current || "Pick a model"}
        >
          <span className="max-w-[80px] truncate">{short}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="flex h-[85vh] flex-col p-0">
        <SheetHeader className="border-b border-border/60 p-4">
          <SheetTitle>Choose a model</SheetTitle>
        </SheetHeader>
        <div className="border-b border-border/60 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search — type 'free' to filter free models"
              className="pl-9"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => setQ(isFreeQuery ? stripped : (stripped ? `${stripped} free` : "free"))}
              className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${
                isFreeQuery ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              Free
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-1">
          {!hasKey && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Add your OpenRouter API key on the Account tab to load models.
            </p>
          )}
          {hasKey && models.isLoading && <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>}
          {hasKey && models.error && <p className="p-4 text-sm text-destructive">{(models.error as Error).message}</p>}
          {filtered.map((m) => {
            const priceFree =
              (!m.pricing?.prompt || parseFloat(m.pricing.prompt) === 0) &&
              (!m.pricing?.completion || parseFloat(m.pricing.completion) === 0);
            const active = m.id === current;
            return (
              <button
                key={m.id}
                onClick={() => { onSelect(m.id); setOpen(false); toast.success(`Model: ${m.id}`); }}
                className={`flex w-full items-start gap-2 rounded-md px-3 py-2 text-left hover:bg-accent ${active ? "bg-accent" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{m.name}</div>
                  <div className="truncate font-mono text-[10px] text-muted-foreground">{m.id}</div>
                </div>
                {priceFree && <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-medium uppercase text-primary">free</span>}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ThreadsSidebarTrigger({ activeId }: { activeId: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listThreads);
  const createFn = useServerFn(createThread);
  const deleteFn = useServerFn(deleteThread);
  const reposFn = useServerFn(listRepoSelections);
  const threads = useQuery({ queryKey: ["threads"], queryFn: () => listFn(), enabled: open });
  const repos = useQuery({ queryKey: ["repo_selections"], queryFn: () => reposFn(), enabled: open });

  const createMut = useMutation({
    mutationFn: (repoId: string) => createFn({ data: { repoId } }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      setOpen(false);
      navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
    },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: (_r, id) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      if (id === activeId) navigate({ to: "/chat" });
    },
  });

  const canCreate = (repos.data ?? []).length > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[85vw] max-w-sm flex-col p-0">
        <SheetHeader className="border-b border-border/60 p-4">
          <SheetTitle>Chats</SheetTitle>
        </SheetHeader>
        <div className="border-b border-border/60 p-3">
          <Button
            className="w-full"
            disabled={!canCreate || createMut.isPending}
            onClick={() => canCreate && createMut.mutate(repos.data![0].id)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New chat
          </Button>
          {!canCreate && <p className="mt-2 text-center text-xs text-muted-foreground">Add a repo on Account first.</p>}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {threads.isLoading && <Loader2 className="mx-auto h-4 w-4 animate-spin" />}
          {(threads.data ?? []).map((t) => {
            const active = t.id === activeId;
            return (
              <div key={t.id} className={`group flex items-center rounded-md ${active ? "bg-accent" : "hover:bg-accent/50"}`}>
                <button
                  onClick={() => { setOpen(false); navigate({ to: "/chat/$threadId", params: { threadId: t.id } }); }}
                  className="flex-1 truncate px-3 py-2 text-left text-sm"
                >
                  <MessageSquare className="mr-2 inline h-3.5 w-3.5 text-muted-foreground" />
                  {t.title}
                </button>
                <button
                  onClick={() => delMut.mutate(t.id)}
                  className="mr-1 rounded p-1.5 opacity-0 hover:bg-destructive/20 group-hover:opacity-100"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            );
          })}
          {threads.data && threads.data.length === 0 && (
            <p className="p-3 text-xs text-muted-foreground">No chats yet.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}