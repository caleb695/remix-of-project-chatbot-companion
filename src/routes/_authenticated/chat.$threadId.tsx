import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Send, Loader2, Plus, Trash2, MessageSquare, Search, ChevronDown, X, Github, Zap,
  ExternalLink, GitBranch, Menu, Brain, Hammer, Bug, Sparkles, ArrowUpRight, FileDiff, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getThreadMessages, listThreads, createThread, deleteThread, getThread, updateThread } from "@/lib/threads.functions";
import { listRepoSelections, commitAndPush } from "@/lib/github.functions";
import { listOpenrouterModels, getOpenrouterSettings } from "@/lib/openrouter.functions";
import { enqueueCodingJob, listJobsForThread, getJob, cancelJob } from "@/lib/jobs.functions";
import { listAgentEvents, getStagedChanges, setThreadMode, branchThread } from "@/lib/agent.functions";
import { useKeyboardInset } from "@/hooks/use-keyboard-inset";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThreadPage,
});

type Mode = "plan" | "build" | "debug" | "improve";

const MODES: Array<{ id: Mode; label: string; icon: typeof Brain; hint: string }> = [
  { id: "plan", label: "Plan", icon: Brain, hint: "Brainstorm and ask questions. No files are changed." },
  { id: "build", label: "Build", icon: Hammer, hint: "Agentic coding — edits your working copy." },
  { id: "debug", label: "Debug", icon: Bug, hint: "Finds and fixes real problems." },
  { id: "improve", label: "Improve", icon: Sparkles, hint: "Adds features and improves existing code." },
];

const PHASE_LABEL: Record<string, string> = {
  waiting: "Waiting",
  planning: "Planning",
  coding: "Coding",
  checking: "Checking code",
  debugging: "Debugging",
  done: "Done",
};

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
      thread={thread.data as ThreadData}
    />
  );
}

type ThreadData = {
  id: string;
  title: string;
  model: string | null;
  mode?: string | null;
  repo_selection_id: string;
  repo_selections: { owner: string; name: string; working_branch: string; workflow_installed_at?: string | null } | null;
};

function ChatView({ threadId, initial, thread }: { threadId: string; initial: UIMessage[]; thread: ThreadData }) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateThread);
  const modeFn = useServerFn(setThreadMode);
  const model = thread.model ?? "";
  const repoId = thread.repo_selection_id;
  const [mode, setMode] = useState<Mode>(((thread.mode as Mode) ?? "build"));
  const [taskId, setTaskId] = useState<string | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);

  const kb = useKeyboardInset();

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

  const { messages, sendMessage, status, error, stop } = useChat({ id: threadId, messages: initial, transport });
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const [composerH, setComposerH] = useState(120);

  const busy = status === "submitted" || status === "streaming";

  useLayoutEffect(() => {
    if (!composerRef.current) return;
    const el = composerRef.current;
    const ro = new ResizeObserver(() => setComposerH(el.offsetHeight));
    ro.observe(el);
    setComposerH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  const autoGrow = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = Math.round(window.innerHeight * 0.45);
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }, []);

  useEffect(() => { autoGrow(); }, [input, autoGrow]);
  useEffect(() => { scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" }); }, [messages, status, composerH]);
  useEffect(() => { inputRef.current?.focus(); }, [threadId]);

  const submit = () => {
    const text = input.trim();
    if (!text || busy) return;
    const id = crypto.randomUUID();
    setTaskId(id);
    sendMessage({ text }, { body: { taskId: id, mode } });
    setInput("");
    requestAnimationFrame(autoGrow);
  };

  // live phase for the process indicator
  const eventsFn = useServerFn(listAgentEvents);
  const events = useQuery({
    queryKey: ["agent_events", threadId, taskId],
    queryFn: () => eventsFn({ data: { threadId, ...(taskId ? { taskId } : {}) } }),
    enabled: Boolean(taskId),
    refetchInterval: busy || activityOpen ? 1500 : false,
  });
  const lastEvent = events.data?.[events.data.length - 1];
  const phase = status === "submitted" && !lastEvent ? "waiting" : (lastEvent?.phase ?? (busy ? "planning" : "done"));
  const limitError = events.data?.filter((e) => e.kind === "error").slice(-1)[0]?.text ?? null;

  const enqueueFn = useServerFn(enqueueCodingJob);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const runMut = useMutation({
    mutationFn: (prompt: string) => enqueueFn({ data: { threadId, prompt } }),
    onSuccess: (r) => { setActiveJobId(r.jobId); setInput(""); qc.invalidateQueries({ queryKey: ["jobs", threadId] }); toast.success("Long-running job started on GitHub Actions"); },
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

  const changeMode = (m: Mode) => { setMode(m); modeFn({ data: { id: threadId, mode: m } }).catch(() => {}); };

  const navigate = useNavigate();
  const branchFn = useServerFn(branchThread);
  const branchMut = useMutation({
    mutationFn: () => branchFn({ data: { threadId } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Summarised — continuing in a new chat");
      navigate({ to: "/chat/$threadId", params: { threadId: r.threadId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="relative h-full">
      <header className="flex items-center gap-2 border-b border-border/60 px-2 py-1.5">
        <ThreadsSidebarTrigger activeId={threadId} />
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-[13px] font-medium">{thread.title}</div>
          <RepoPill thread={thread} onChange={(id) => setRepo.mutate(id)} />
        </div>
        <Button
          size="icon" variant="ghost" className="h-8 w-8 shrink-0"
          title="Branch into a new chat with a summary of this one"
          disabled={branchMut.isPending || messages.length === 0}
          onClick={() => branchMut.mutate()}
        >
          {branchMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
        </Button>
      </header>

      <div
        ref={scrollerRef}
        className="h-[calc(100%-2.5rem)] overflow-y-auto overscroll-contain"
        style={{ paddingBottom: composerH + 12 }}
      >
        <div className="mx-auto max-w-3xl px-3 py-3 space-y-4">
          {messages.length === 0 && (
            <div className="pt-10 text-center text-sm text-muted-foreground">
              {thread.repo_selections
                ? <>Working on <span className="font-mono">{thread.repo_selections.owner}/{thread.repo_selections.name}</span>.</>
                : "Pick a repo to get started."}
            </div>
          )}
          {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          <JobsPanel threadId={threadId} activeJobId={activeJobId} onClear={() => setActiveJobId(null)} repo={thread.repo_selections} />
        </div>
      </div>

      {/* Composer — pinned above the keyboard */}
      <div
        ref={composerRef}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background"
        style={{
          transform: `translateY(-${kb}px)`,
          paddingBottom: kb > 0 ? 6 : "calc(3.75rem + env(safe-area-inset-bottom))",
        }}
      >
        <CommitBar repoId={repoId} busy={busy} branch={thread.repo_selections?.working_branch ?? "main"} />

        {(taskId || busy) && (
          <button
            type="button"
            onClick={() => { if (phase !== "waiting") setActivityOpen(true); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] text-muted-foreground"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : <Check className="h-3 w-3 text-primary" />}
            <span className="font-medium text-foreground">{PHASE_LABEL[phase] ?? phase}</span>
            {lastEvent && phase !== "waiting" && <span className="truncate">· {lastEvent.text}</span>}
            {phase !== "waiting" && <ArrowUpRight className="ml-auto h-3 w-3 shrink-0" />}
          </button>
        )}
        {limitError && (
          <p className="px-3 pb-1 text-[11px] text-destructive">{limitError}</p>
        )}

        <div className="px-2 pt-1">
          <div className="mb-1.5 flex items-center gap-1.5 overflow-x-auto">
            <ModePicker mode={mode} onChange={changeMode} />
            <ModelPicker current={model} onSelect={(m) => setModel.mutate(m)} />
            <Button
              type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0"
              title="Run as a long job on GitHub Actions"
              disabled={runMut.isPending || !input.trim() || !thread.repo_selections?.workflow_installed_at}
              onClick={() => runMut.mutate(input.trim())}
            >
              {runMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={mode === "plan" ? "Plan or ask anything…" : "Describe the change…"}
              className="min-h-[44px] flex-1 resize-none text-base leading-snug"
            />
            {busy ? (
              <Button type="button" size="icon" variant="secondary" className="h-11 w-11 shrink-0" onClick={() => stop()}>
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" size="icon" className="h-11 w-11 shrink-0" disabled={!input.trim()} onClick={submit}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <ActivitySheet
        open={activityOpen}
        onOpenChange={setActivityOpen}
        events={events.data ?? []}
        phase={phase}
        busy={busy}
      />
    </div>
  );
}

/* ---------------------------------- modes --------------------------------- */

function ModePicker({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const [open, setOpen] = useState(false);
  const current = MODES.find((m) => m.id === mode) ?? MODES[1];
  const Icon = current.icon;
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-border bg-card px-2.5 text-[11px] font-medium">
          <Icon className="h-3.5 w-3.5 text-primary" />
          {current.label}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader><SheetTitle>Agent mode</SheetTitle></SheetHeader>
        <div className="mt-3 space-y-1">
          {MODES.map((m) => {
            const I = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => { onChange(m.id); setOpen(false); }}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent ${m.id === mode ? "bg-accent" : ""}`}
              >
                <I className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.hint}</div>
                </div>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------- activity -------------------------------- */

type AgentEvent = {
  id: string; agent_id: string; agent_label: string; phase: string;
  kind: string; text: string; created_at: string;
};

function ActivitySheet({ open, onOpenChange, events, phase, busy }: {
  open: boolean; onOpenChange: (v: boolean) => void; events: AgentEvent[]; phase: string; busy: boolean;
}) {
  const agents = Array.from(new Set(events.map((e) => e.agent_id)));
  const [agent, setAgent] = useState<string>("main");
  const shown = events.filter((e) => e.agent_id === (agents.includes(agent) ? agent : agents[0] ?? "main"));
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[88vh] flex-col p-0">
        <SheetHeader className="border-b border-border/60 p-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            {busy && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            {PHASE_LABEL[phase] ?? phase}
          </SheetTitle>
        </SheetHeader>
        {agents.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto border-b border-border/60 p-2">
            {agents.map((a) => (
              <button
                key={a}
                onClick={() => setAgent(a)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${a === agent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {events.find((e) => e.agent_id === a)?.agent_label ?? a}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {shown.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet.</p>}
          {shown.map((e) => (
            <div key={e.id} className="flex gap-2.5">
              <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                e.kind === "error" ? "bg-destructive" : e.kind === "action" ? "bg-primary" : "bg-muted-foreground/50"
              }`} />
              <div className="min-w-0">
                <p className={`text-sm leading-snug ${e.kind === "thought" ? "italic text-muted-foreground" : e.kind === "error" ? "text-destructive" : "text-foreground"}`}>
                  {e.text}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  {PHASE_LABEL[e.phase] ?? e.phase} · {new Date(e.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------- commit bar ------------------------------- */

function CommitBar({ repoId, busy, branch }: { repoId: string; busy: boolean; branch: string }) {
  const stagedFn = useServerFn(getStagedChanges);
  const commitFn = useServerFn(commitAndPush);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const staged = useQuery({
    queryKey: ["staged", repoId],
    queryFn: () => stagedFn({ data: { repoId } }),
    refetchInterval: busy ? 3000 : 15000,
  });
  const commitMut = useMutation({
    mutationFn: (msg: string) => commitFn({ data: { repoId, message: msg } }),
    onSuccess: (r) => {
      toast.success(`Pushed ${r.count} file(s) to ${branch}`);
      setOpen(false); setMessage("");
      qc.invalidateQueries({ queryKey: ["staged", repoId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = staged.data ?? [];
  if (rows.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border/60 bg-primary/5 px-3 py-1.5">
        <FileDiff className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px]">
          <span className="font-medium">{rows.length}</span> staged change{rows.length === 1 ? "" : "s"}
        </span>
        <Button size="sm" variant="ghost" className="ml-auto h-7 px-2 text-[11px]" onClick={() => setOpen(true)}>
          Review
        </Button>
        <Button
          size="sm" className="h-7 px-2.5 text-[11px]"
          disabled={commitMut.isPending}
          onClick={() => commitMut.mutate(`Coderbot: update ${rows.length} file(s)`)}
        >
          {commitMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Commit"}
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="flex h-[80vh] flex-col p-0">
          <SheetHeader className="border-b border-border/60 p-4">
            <SheetTitle>Staged changes · {branch}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-3">
            {rows.map((f) => (
              <div key={f.path} className="flex items-center gap-2 border-b border-border/40 py-2 font-mono text-[11px]">
                <span className={`w-14 shrink-0 uppercase ${
                  f.status === "added" ? "text-emerald-500" : f.status === "deleted" ? "text-destructive" : "text-amber-500"
                }`}>{f.status}</span>
                <span className="truncate">{f.path}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-border/60 p-3">
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Commit message (optional)" />
            <Button
              className="w-full"
              disabled={commitMut.isPending}
              onClick={() => commitMut.mutate(message.trim() || `Coderbot: update ${rows.length} file(s)`)}
            >
              {commitMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Commit & push to ${branch}`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/* --------------------------------- jobs ---------------------------------- */

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
  const d = (detail.data ?? active) as {
    id: string; status: string; prompt: string; error: string | null;
    logs?: string | null; commit_sha?: string | null;
  };
  const running = d.status === "queued" || d.status === "running";

  return (
    <div className="rounded-lg border border-border bg-card p-3 text-xs">
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium">Actions job · {d.status}</span>
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
      {d.logs ? (
        <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-muted/50 p-2 font-mono text-[10px] text-muted-foreground">{d.logs}</pre>
      ) : null}
      {d.error && <p className="mt-2 text-destructive">{d.error}</p>}
      <div className="mt-2 flex gap-2">
        {running && <Button size="sm" variant="outline" onClick={() => cancelMut.mutate(d.id)}>Cancel</Button>}
        {!running && <Button size="sm" variant="ghost" onClick={onClear}>Dismiss</Button>}
      </div>
    </div>
  );
}

/* -------------------------------- messages -------------------------------- */

const TOOL_VERB: Record<string, string> = {
  write_file: "Wrote", edit_file: "Edited", delete_file: "Deleted", read_file: "Read",
  list_files: "Listed files", search_code: "Searched", check_code: "Checked code",
  staged_changes: "Reviewed staged changes",
};

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={isUser ? "max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground" : "max-w-full text-foreground"}>
        {message.parts.map((part, i) => {
          if (part.type === "text") return <div key={i} className="whitespace-pre-wrap text-sm leading-relaxed">{part.text}</div>;
          if (part.type.startsWith("tool-")) {
            const p = part as { type: string; input?: unknown };
            const name = p.type.replace(/^tool-/, "");
            const path = (p.input as { path?: string; query?: string } | undefined)?.path
              ?? (p.input as { query?: string } | undefined)?.query ?? "";
            return (
              <div key={i} className="my-1 inline-flex max-w-full items-center gap-1.5 rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                <span className="text-foreground">{TOOL_VERB[name] ?? name}</span>
                {path && <span className="truncate">{path}</span>}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

/* ------------------------------- repo + model ----------------------------- */

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
  const hasKey = Boolean(settings.data?.has_key || settings.data?.has_mistral_key || settings.data?.has_groq_key || settings.data?.has_nvidia_key);
  const models = useQuery({ queryKey: ["or_models"], queryFn: () => modelsFn(), enabled: open && hasKey });

  const needle = q.trim().toLowerCase();
  const filtered = (models.data ?? []).filter((m) => !needle || `${m.id} ${m.name}`.toLowerCase().includes(needle));
  const short = current ? current.split("/").pop() ?? current : "model";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex h-8 min-w-0 flex-1 items-center gap-1 rounded-full border border-border bg-card px-2.5 font-mono text-[11px] text-muted-foreground"
          title={current || "Pick a model"}
        >
          <span className="truncate">{short}</span>
          <ChevronDown className="ml-auto h-3 w-3 shrink-0" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="flex h-[85vh] flex-col p-0">
        <SheetHeader className="border-b border-border/60 p-4">
          <SheetTitle>Choose a model</SheetTitle>
        </SheetHeader>
        <div className="border-b border-border/60 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search models" className="pl-9" />
            {q && (
              <button type="button" onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-1">
          {!hasKey && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Add an AI provider key on the Account tab to load models.
            </p>
          )}
          {hasKey && models.isLoading && <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>}
          {hasKey && models.error && <p className="p-4 text-sm text-destructive">{(models.error as Error).message}</p>}
          {filtered.map((m) => {
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
                {active && <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------- sidebar -------------------------------- */

function ThreadsSidebarTrigger({ activeId }: { activeId: string }) {
  const [open, setOpen] = useState(false);
  const listFn = useServerFn(listThreads);
  const createFn = useServerFn(createThread);
  const delFn = useServerFn(deleteThread);
  const reposFn = useServerFn(listRepoSelections);
  const qc = useQueryClient();
  const navigate = useNavigate();

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
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["threads"] }),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0"><Menu className="h-4 w-4" /></Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[85vw] max-w-sm flex-col p-0">
        <SheetHeader className="border-b border-border/60 p-4"><SheetTitle>Chats</SheetTitle></SheetHeader>
        <div className="border-b border-border/60 p-2">
          <Button
            size="sm" className="w-full"
            disabled={!repos.data?.length || createMut.isPending}
            onClick={() => repos.data?.[0] && createMut.mutate(repos.data[0].id)}
          >
            <Plus className="mr-1 h-4 w-4" /> New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-1">
          {threads.isLoading && <Loader2 className="mx-auto mt-4 h-4 w-4 animate-spin" />}
          {(threads.data ?? []).map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-1 rounded-md px-2 py-2 ${t.id === activeId ? "bg-accent" : "hover:bg-accent/60"}`}
            >
              <button
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => { setOpen(false); navigate({ to: "/chat/$threadId", params: { threadId: t.id } }); }}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm">{t.title}</span>
              </button>
              <button
                className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive"
                onClick={() => delMut.mutate(t.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
