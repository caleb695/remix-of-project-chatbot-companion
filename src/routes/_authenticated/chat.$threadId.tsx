import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { type UIMessage } from "ai";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Send, Loader2, Plus, Trash2, MessageSquare, Search, ChevronDown, X, Github, Zap,
  ExternalLink, GitBranch, Menu, Brain, Hammer, Bug, Sparkles, ArrowUpRight, FileDiff, Check, NotebookPen,
  Users, Paperclip, Eye, EyeOff, HardDrive,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getThreadMessages, listThreads, createThread, deleteThread, getThread, updateThread } from "@/lib/threads.functions";
import { listRepoSelections, commitAndPush } from "@/lib/github.functions";
import { getKaggleStaged, pushKaggleNotebook, listKaggleNotebooks } from "@/lib/kaggle.functions";
import { listOpenrouterModels, getOpenrouterSettings } from "@/lib/openrouter.functions";
import { enqueueCodingJob, listJobsForThread, getJob, cancelJob, getJobDiff, approveJob, discardJob } from "@/lib/jobs.functions";
import { listAgentEvents, getStagedChanges, setThreadMode, branchThread } from "@/lib/agent.functions";
import { getSubAgents, setSubAgents } from "@/lib/subagents.functions";
import { listAttachments, registerAttachment, setAttachmentCodeOnly, deleteAttachment } from "@/lib/attachments.functions";
import { getThreadChat, getRunState, setRunState } from "@/lib/chat-store";
import { useKeyboardInset } from "@/hooks/use-keyboard-inset";
import { DrivePicker } from "@/components/DrivePicker";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Chat — Coderbot" },
      { name: "description", content: "Work with the Coderbot agent on your repo or Kaggle notebook." },
      { property: "og:title", content: "Chat — Coderbot" },
      { property: "og:description", content: "Work with the Coderbot agent on your repo or Kaggle notebook." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
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

  const initial = useQuery({
    queryKey: ["messages", threadId],
    queryFn: () => getMsgs({ data: { threadId } }),
    // GitHub Actions owns durable runs, so keep pulling persisted turns even
    // after a tab/device restart where the in-memory active job id is gone.
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });
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
  target?: string | null;
  repo_selection_id: string | null;
  kaggle_notebook_id?: string | null;
  repo_selections: { owner: string; name: string; working_branch: string; workflow_installed_at?: string | null } | null;
  kaggle_notebooks?: { owner: string; slug: string; title: string; status?: string | null } | null;
};

function ChatView({ threadId, initial, thread }: { threadId: string; initial: UIMessage[]; thread: ThreadData }) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateThread);
  const modeFn = useServerFn(setThreadMode);
  const model = thread.model ?? "";
  const isKaggle = thread.target === "kaggle" && Boolean(thread.kaggle_notebook_id);
  const repoId = thread.repo_selection_id ?? "";
  const notebookId = thread.kaggle_notebook_id ?? "";
  const [mode, setMode] = useState<Mode>(((thread.mode as Mode) ?? "build"));
  const [taskId, setTaskIdState] = useState<string | null>(() => getRunState(threadId).taskId);
  const setTaskId = useCallback((id: string | null) => {
    setTaskIdState(id);
    setRunState(threadId, { taskId: id });
  }, [threadId]);

  const [activityOpen, setActivityOpen] = useState(false);

  const kb = useKeyboardInset();

  const chat = useMemo(() => getThreadChat(threadId, repoId, initial), [threadId, repoId, initial]);

  const { messages, sendMessage, setMessages, status, error, stop } = useChat({ chat });
  // Server-side runs append their turns in the database; mirror them in here.
  useEffect(() => {
    if (initial.length > messages.length) setMessages(initial);
  }, [initial, messages.length, setMessages]);

  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const [composerH, setComposerH] = useState(120);

  // For durable runs (GitHub Actions), don't block user input while the job is running
  // since the user can send follow-up messages that will be queued for the next run.
  // For in-page streaming (Kaggle, plan mode), still block to avoid concurrent requests.
  const busy = (status === "submitted" || status === "streaming") && !durable;
  // Build/Debug/Improve runs happen on GitHub Actions so they survive closing
  // the tab. Plan mode stays as a live in-page conversation.
  // Kaggle notebooks have no GitHub Actions runner, so they always stream in-page.
  const durable = !isKaggle && mode !== "plan" && Boolean(thread.repo_selections?.workflow_installed_at);

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

  // live phase for the process indicator
  const eventsFn = useServerFn(listAgentEvents);
  const enqueueFn = useServerFn(enqueueCodingJob);
  const listJobsFn = useServerFn(listJobsForThread);
  const [activeJobId, setActiveJobIdState] = useState<string | null>(() => getRunState(threadId).jobId);
  const setActiveJobId = useCallback((id: string | null) => {
    setActiveJobIdState(id);
    setRunState(threadId, { jobId: id });
  }, [threadId]);

  const durableJobs = useQuery({
    queryKey: ["jobs", threadId],
    queryFn: () => listJobsFn({ data: { threadId } }),
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });
  useEffect(() => {
    const jobs = durableJobs.data ?? [];
    const active = jobs.find((candidate) => ["queued", "running"].includes(candidate.status));
    // After a reload there may be no active job, but the last finished run's
    // activity log should still be reachable from the composer.
    const target = active ?? jobs[0];
    if (!target) return;
    if (active && activeJobId !== active.id) setActiveJobId(active.id);
    if (target.task_id && taskId !== target.task_id) setTaskId(target.task_id);
  }, [activeJobId, durableJobs.data, setActiveJobId, setTaskId, taskId]);

  const runMut = useMutation({
    mutationFn: (prompt: string) => enqueueFn({ data: { threadId, prompt, mode, taskId: crypto.randomUUID() } }),
    onSuccess: (r) => {
      setActiveJobId(r.jobId);
      setTaskId(r.taskId);
      setInput("");
      qc.invalidateQueries({ queryKey: ["jobs", threadId] });
      qc.invalidateQueries({ queryKey: ["messages", threadId] });
      toast.success("Running on GitHub Actions — safe to close the tab");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    const text = input.trim();
    if (!text || runMut.isPending) return;
    if (durable) { runMut.mutate(text); return; }
    const id = crypto.randomUUID();
    setTaskId(id);
    sendMessage({ text }, { body: { taskId: id, mode } });
    setInput("");
    requestAnimationFrame(autoGrow);
  };

  const jobFn = useServerFn(getJob);
  const cancelFn = useServerFn(cancelJob);
  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["job", activeJobId] }); toast.success("Run cancelled"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const job = useQuery({
    queryKey: ["job", activeJobId],
    queryFn: () => jobFn({ data: { id: activeJobId! } }),
    enabled: Boolean(activeJobId),
    refetchInterval: 3000,
  });
  const jobRunning = job.data ? ["queued", "running"].includes(job.data.status) : false;
  const working = busy || runMut.isPending || jobRunning;

  // The in-page stream (Kaggle, plan mode) ends before the server's final
  // "done" status event is committed, so the process indicator used to freeze
  // on a stale phase with a checkmark the moment `working` flipped to false.
  // Track when a run stopped being busy; keep polling agent_events for a short
  // grace window afterwards until a terminal `done` event arrives, so the
  // indicator settles on its real state instead of freezing on "planning".
  const stoppedAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (working) stoppedAtRef.current = null;
    else if (stoppedAtRef.current === null) stoppedAtRef.current = Date.now();
  }, [working]);
  const withinGrace = stoppedAtRef.current !== null && Date.now() - stoppedAtRef.current < 10_000;

  const events = useQuery({
    queryKey: ["agent_events", threadId, taskId],
    queryFn: () => eventsFn({ data: { threadId, ...(taskId ? { taskId } : {}) } }),
    enabled: Boolean(taskId),
    // Keep polling while the run is live, while the sheet is open, and for a
    // short grace window after it ends — but stop as soon as a terminal `done`
    // event has been fetched so we don't poll a finished run forever.
    refetchInterval: (query) => {
      if (activityOpen) return 1500;
      const rows = query.state.data;
      const last = Array.isArray(rows) ? rows[rows.length - 1] : undefined;
      if (last?.phase === "done") return false;
      if (working || withinGrace) return 1500;
      return false;
    },
  });
  const lastEvent = events.data?.[events.data.length - 1];
  const lastPhase = lastEvent?.phase;
  // Treat an in-page stream error as terminal so the indicator stops on a
  // settled state instead of freezing on a stale "planning" phase when the
  // connection drops before a `done` event is logged.
  const failed = !working && Boolean(error) && lastPhase !== "done";
  const phase = working && !lastEvent ? "waiting" : (failed ? "done" : (lastPhase ?? (working ? "planning" : "done")));
  const limitError = events.data?.filter((e) => e.kind === "error").slice(-1)[0]?.text ?? null;

  // Pull the agent's final message into the transcript when a run finishes.
  const prevRunning = useRef(false);
  useEffect(() => {
    if (prevRunning.current && !jobRunning) {
      qc.invalidateQueries({ queryKey: ["messages", threadId] });
      qc.invalidateQueries({ queryKey: ["staged", repoId] });
    }
    prevRunning.current = jobRunning;
  }, [jobRunning, qc, threadId, repoId]);

  // A remount cannot rely on module memory to identify the active job. The
  // jobs list below discovers it from durable state; transcript polling above
  // independently guarantees the final assistant turn appears.

  const setModel = useMutation({
    mutationFn: (m: string) => updateFn({ data: { id: threadId, model: m } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["thread", threadId] }),
  });
  const setRepo = useMutation({
    mutationFn: (id: string) => updateFn({ data: { id: threadId, repo_selection_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["thread", threadId] }),
  });
  const setNotebook = useMutation({
    mutationFn: (id: string) => updateFn({ data: { id: threadId, kaggle_notebook_id: id } }),
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
          <RepoPill
            thread={thread}
            onChange={(id) => setRepo.mutate(id)}
            onChangeNotebook={(id) => setNotebook.mutate(id)}
          />
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
              {isKaggle && thread.kaggle_notebooks
                ? <>Working on the Kaggle notebook <span className="font-mono">{thread.kaggle_notebooks.owner}/{thread.kaggle_notebooks.slug}</span>.</>
                : thread.repo_selections
                  ? <>Working on <span className="font-mono">{thread.repo_selections.owner}/{thread.repo_selections.name}</span>.</>
                  : "Pick a repo or Kaggle notebook to get started."}
            </div>
          )}
          {messages.map((m, i) => {
            // The last assistant message while an in-page run is streaming is
            // the live run — surface it as a RunCard instead of inline parts.
            // Only Kaggle notebook runs hide their streaming thoughts/actions
            // behind a RunCard — plan mode is a normal chat whose text reply
            // is the actual output, so it must stay visible.
            const isLiveRun = isKaggle && busy && !durable && m.role === "assistant" && i === messages.length - 1 && Boolean(taskId);
            return (
              <MessageBubble
                key={m.id}
                message={m}
                threadId={threadId}
                liveRun={isLiveRun ? { taskId: taskId!, kaggle: isKaggle } : null}
              />
            );
          })}
          {error && (
            <p className="text-sm text-destructive">
              {/load failed|failed to fetch|networkerror|network request/i.test(error.message)
                ? "The connection to the model was interrupted. Check your network and try again."
                : error.message}
            </p>
          )}
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
        {isKaggle
          ? <KaggleCommitBar notebookId={notebookId} busy={working} />
          : <CommitBar repoId={repoId} busy={working} branch={thread.repo_selections?.working_branch ?? "main"} />}

        {(taskId || working) && (
          <button
            type="button"
            onClick={() => { if (phase !== "waiting") setActivityOpen(true); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] text-muted-foreground"
          >
            {working ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : <Check className="h-3 w-3 text-primary" />}
            <span className="font-medium text-foreground">{PHASE_LABEL[phase] ?? phase}</span>
            {lastEvent && phase !== "waiting" && <span className="truncate">· {lastEvent.text}</span>}
            {phase !== "waiting" && <ArrowUpRight className="ml-auto h-3 w-3 shrink-0" />}
          </button>
        )}
        {limitError && (
          <p className="px-3 pb-1 text-[11px] text-destructive">{limitError}</p>
        )}
        {job.data?.status === "failed" && job.data.error && (
          <p className="px-3 pb-1 text-[11px] text-destructive">Run failed: {job.data.error}</p>
        )}

        <div className="px-2 pt-1">
          <div className="mb-1.5 flex items-center gap-1.5 overflow-x-auto">
            <ModePicker mode={mode} onChange={changeMode} />
            <ModelPicker current={model} onSelect={(m) => setModel.mutate(m)} />
            <SubAgentsPicker threadId={threadId} />
            <span className="ml-auto flex shrink-0 items-center gap-1 whitespace-nowrap text-[10px] text-muted-foreground">
              <Zap className="h-3 w-3 text-primary" />
              {durable ? "Runs on GitHub Actions"
                : isKaggle ? "Kaggle notebook"
                : mode === "plan" ? "Live chat" : "Install the workflow first"}
            </span>
          </div>
          <div className="flex items-end gap-2">
            <AttachButton threadId={threadId} />
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
            {busy || jobRunning ? (
              <Button
                type="button" size="icon" variant="secondary" className="h-11 w-11 shrink-0"
                onClick={() => { if (jobRunning && activeJobId) cancelMut.mutate(activeJobId); else stop(); }}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" size="icon" className="h-11 w-11 shrink-0" disabled={!input.trim() || runMut.isPending} onClick={submit}>
                {runMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
        busy={working}
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

/* ------------------------------- sub-agents ------------------------------- */

type SubAgent = { id: string; label: string; model: string; instructions?: string };

function SubAgentsPicker({ threadId }: { threadId: string }) {
  const listFn = useServerFn(getSubAgents);
  const saveFn = useServerFn(setSubAgents);
  const modelsFn = useServerFn(listOpenrouterModels);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const agents = useQuery({
    queryKey: ["sub-agents", threadId],
    queryFn: () => listFn({ data: { threadId } }),
  });
  const models = useQuery({
    queryKey: ["or-models"],
    queryFn: () => modelsFn({}),
    enabled: open,
    staleTime: 10 * 60 * 1000,
  });
  const save = useMutation({
    mutationFn: (subAgents: SubAgent[]) => saveFn({ data: { threadId, subAgents } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sub-agents", threadId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const list = (agents.data ?? []) as SubAgent[];
  const update = (next: SubAgent[]) => save.mutate(next);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-border bg-card px-2.5 text-[11px] font-medium">
          <Users className="h-3.5 w-3.5 text-primary" />
          {list.length ? `${list.length} sub-agent${list.length === 1 ? "" : "s"}` : "Sub-agents"}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="flex h-[85vh] flex-col p-0">
        <SheetHeader className="border-b border-border/60 p-4">
          <SheetTitle>Sub-agents</SheetTitle>
          <p className="text-xs text-muted-foreground">
            The main agent splits the task and delegates parts to these agents so they work in parallel on the same checkout.
          </p>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {list.length === 0 && <p className="text-sm text-muted-foreground">No sub-agents yet.</p>}
          {list.map((a, i) => (
            <div key={a.id} className="space-y-2 rounded-lg border border-border/60 p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={a.label}
                  onChange={(e) => update(list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  className="h-8 text-sm"
                  placeholder="Name (e.g. Frontend)"
                />
                <Button
                  size="icon" variant="ghost" className="h-8 w-8 shrink-0"
                  onClick={() => update(list.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              <select
                value={a.model}
                onChange={(e) => update(list.map((x, j) => (j === i ? { ...x, model: e.target.value } : x)))}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value={a.model}>{a.model}</option>
                {(models.data ?? []).filter((m) => m.id !== a.model).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <Textarea
                rows={2}
                value={a.instructions ?? ""}
                onChange={(e) => update(list.map((x, j) => (j === i ? { ...x, instructions: e.target.value } : x)))}
                placeholder="What this agent owns (e.g. UI components under src/components)"
                className="resize-none text-xs"
              />
            </div>
          ))}
        </div>
        <div className="border-t border-border/60 p-3">
          <Button
            className="w-full"
            disabled={save.isPending || list.length >= 20}
            onClick={() =>
              update([
                ...list,
                {
                  id: `agent-${Date.now().toString(36)}`,
                  label: `Agent ${list.length + 1}`,
                  model: (models.data ?? [])[0]?.id ?? "",
                  instructions: "",
                },
              ])
            }
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1 h-4 w-4" /> Add sub-agent</>}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------- attachments ------------------------------ */

function AttachButton({ threadId }: { threadId: string }) {
  const listFn = useServerFn(listAttachments);
  const registerFn = useServerFn(registerAttachment);
  const toggleFn = useServerFn(setAttachmentCodeOnly);
  const removeFn = useServerFn(deleteAttachment);
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const files = useQuery({
    queryKey: ["attachments", threadId],
    queryFn: () => listFn({ data: { threadId } }),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["attachments", threadId] });

  const toggle = useMutation({
    mutationFn: (v: { id: string; codeOnly: boolean }) => toggleFn({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const upload = async (picked: FileList) => {
    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");
      for (const file of Array.from(picked)) {
        const safe = file.name.replace(/[^\w.-]+/g, "_");
        const storagePath = `${uid}/${threadId}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage.from("attachments").upload(storagePath, file);
        if (error) throw error;
        await registerFn({
          data: { threadId, name: safe, mimeType: file.type || undefined, sizeBytes: file.size, storagePath },
        });
      }
      invalidate();
      toast.success("Uploaded");
      setOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const count = files.data?.length ?? 0;

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); }}
      />
      <div className="relative shrink-0">
        <Button
          type="button" size="icon" variant="secondary" className="h-11 w-11"
          onClick={() => setOpen(true)}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        </Button>
        {count > 0 && (
          <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {count}
          </span>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="flex max-h-[80vh] flex-col p-0">
          <SheetHeader className="border-b border-border/60 p-4">
            <SheetTitle>Uploaded files</SheetTitle>
            <p className="text-xs text-muted-foreground">
              Every file is placed in <code>uploads/</code> so the agent's code can use it. Turn off “AI can read” to keep the
              contents private — the agent only knows the file exists.
            </p>
          </SheetHeader>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {count === 0 && <p className="text-sm text-muted-foreground">Nothing uploaded yet.</p>}
            {(files.data ?? []).map((f) => (
              <div key={f.id} className="flex items-center gap-2 rounded-lg border border-border/60 p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{f.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {f.mime_type ?? "file"}{f.size_bytes ? ` · ${Math.max(1, Math.round(f.size_bytes / 1024))} KB` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle.mutate({ id: f.id, codeOnly: !f.code_only })}
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] ${
                    f.code_only ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                  }`}
                >
                  {f.code_only ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {f.code_only ? "Code only" : "AI can read"}
                </button>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => remove.mutate(f.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-border/60 p-3">
            <Button variant="secondary" className="flex-1" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <Plus className="mr-1 h-4 w-4" /> Add files
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => { setOpen(false); setDriveOpen(true); }}>
              <HardDrive className="mr-1 h-4 w-4" /> Google Drive
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <DrivePicker threadId={threadId} open={driveOpen} onOpenChange={setDriveOpen} onImported={invalidate} />
    </>
  );
}

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

function KaggleCommitBar({ notebookId, busy }: { notebookId: string; busy: boolean }) {
  const stagedFn = useServerFn(getKaggleStaged);
  const pushFn = useServerFn(pushKaggleNotebook);
  const qc = useQueryClient();
  const staged = useQuery({
    queryKey: ["kaggle_staged", notebookId],
    queryFn: () => stagedFn({ data: { id: notebookId } }),
    refetchInterval: busy ? 3000 : 15000,
  });
  const pushMut = useMutation({
    mutationFn: () => pushFn({ data: { id: notebookId } }),
    onSuccess: () => {
      toast.success("Pushed a new notebook version to Kaggle");
      qc.invalidateQueries({ queryKey: ["kaggle_staged", notebookId] });
      qc.invalidateQueries({ queryKey: ["kaggle_notebooks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!staged.data?.dirty) return null;
  return (
    <div className="flex items-center gap-2 border-b border-border/60 bg-primary/5 px-3 py-1.5">
      <FileDiff className="h-3.5 w-3.5 text-primary" />
      <span className="truncate text-[11px]">
        Staged notebook edits · <span className="font-mono">{staged.data.ref}</span>
      </span>
      <Button
        size="sm" className="ml-auto h-7 px-2.5 text-[11px]"
        disabled={pushMut.isPending} onClick={() => pushMut.mutate()}
      >
        {pushMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Commit to Kaggle"}
      </Button>
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
    ?? jobs.data?.find((j) => ["running", "queued"].includes(j.status));
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
  const running = ["queued", "running"].includes(d.status);

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

type RunData = {
  jobId?: string; taskId?: string; status?: string;
  reviewBranch?: string | null; baseBranch?: string | null; commitSha?: string | null;
  files?: Array<{ path: string; status: string }>;
  kaggle?: boolean;
};

function MessageBubble({ message, threadId, liveRun }: { message: UIMessage; threadId: string; liveRun?: { taskId: string; kaggle: boolean } | null }) {
  const isUser = message.role === "user";
  // In-page runs (Kaggle, plan mode) stream the model's thoughts and tool calls
  // as parts of the live assistant message. Showing them inline made the run
  // look like a wall of normal messages. GitHub runs already hide all of this
  // behind a "What it did" RunCard, so do the same for in-page runs: suppress
  // the streaming text/tool parts and surface the activity through a RunCard
  // button (the activity sheet is fed from agent_events either way).
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={isUser ? "max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground" : "max-w-full text-foreground"}>
        {liveRun && (
          <RunCard threadId={threadId} run={{ taskId: liveRun.taskId, kaggle: liveRun.kaggle, status: "running" }} />
        )}
        {(() => {
          // A persisted run message (one with a `data-run` part) carries the
          // model's full streamed text + tool-call parts. Rendering those inline
          // made completed Kaggle runs look like a wall of "thoughts and actions"
          // instead of the clean summary + "What it did" card GitHub runs show.
          // Suppress the inline tool badges for any run message; the activity
          // sheet (fed from agent_events) keeps the full breakdown.
          const hasRunPart = message.parts.some((p) => p.type === "data-run");
          return message.parts.map((part, i) => {
          // The live RunCard above replaces these during the run.
          if (liveRun && part.type === "text") return null;
          // Hide tool-call chatter but keep tool-results that show what was edited
          if ((liveRun || hasRunPart) && part.type.startsWith("tool-call")) return null;
          if (part.type === "text") return <div key={i} className="whitespace-pre-wrap text-sm leading-relaxed">{part.text}</div>;
          // Persisted with the run, so the review + activity stay available
          // long after the tab was closed.
          if (part.type === "data-run") {
            const data = (part as { data?: RunData }).data;
            // GitHub runs carry a jobId; in-page Kaggle runs carry taskId only.
            if (!data?.jobId && !data?.taskId) return null;
            return <RunCard key={i} threadId={threadId} run={data} />;
          }
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
        });
        })()}
      </div>
    </div>
  );
}

/* What the run changed, whether it is waiting for approval, and everything it
 * did along the way — all rebuilt from the database on every load. */
function RunCard({ threadId, run }: { threadId: string; run: RunData }) {
  const qc = useQueryClient();
  const jobFn = useServerFn(getJob);
  const diffFn = useServerFn(getJobDiff);
  const eventsFn = useServerFn(listAgentEvents);
  const approveFn = useServerFn(approveJob);
  const discardFn = useServerFn(discardJob);
  const [changesOpen, setChangesOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const job = useQuery({
    queryKey: ["job", run.jobId],
    queryFn: () => jobFn({ data: { id: run.jobId! } }),
    enabled: Boolean(run.jobId),
  });
  const diff = useQuery({
    queryKey: ["job-diff", run.jobId],
    queryFn: () => diffFn({ data: { id: run.jobId! } }),
    enabled: changesOpen && Boolean(run.jobId),
  });
  const events = useQuery({
    queryKey: ["agent_events", threadId, run.taskId],
    queryFn: () => eventsFn({ data: { threadId, ...(run.taskId ? { taskId: run.taskId } : {}) } }),
    enabled: activityOpen && Boolean(run.taskId),
  });

  const done = () => {
    qc.invalidateQueries({ queryKey: ["job", run.jobId] });
    qc.invalidateQueries({ queryKey: ["jobs", threadId] });
  };
  const approve = useMutation({
    mutationFn: () => approveFn({ data: { id: run.jobId } }),
    onSuccess: (r) => { toast.success(`Merged into ${r.base}`); done(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const discard = useMutation({
    mutationFn: () => discardFn({ data: { id: run.jobId } }),
    onSuccess: () => { toast.success("Changes discarded"); done(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const status = job.data?.status ?? run.status ?? "completed";
  const files = (job.data?.changed_files as Array<{ path: string; status: string }> | undefined)?.length
    ? (job.data!.changed_files as Array<{ path: string; status: string }>)
    : (run.files ?? []);
  const pending = Boolean(run.jobId) && status === "awaiting_review";

  return (
    <div className="mt-2 rounded-lg border border-border bg-card p-3 text-xs">
      <div className="flex items-center gap-2">
        <FileDiff className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium">
          {run.kaggle
            ? status === "running"
              ? <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Working on the notebook…</span>
              : "Changes staged in the notebook"
            : pending ? "Waiting for your approval" : status === "discarded" ? "Changes discarded" : "Changes merged"}
        </span>
        {!run.kaggle && <span className="ml-auto text-muted-foreground">{files.length} file{files.length === 1 ? "" : "s"}</span>}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {!run.kaggle && (
          <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => setChangesOpen(true)}>
            View changes
          </Button>
        )}
        {run.taskId && (
          <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => setActivityOpen(true)}>
            What it did <ArrowUpRight className="ml-1 h-3 w-3" />
          </Button>
        )}
        {pending && (
          <>
            <Button
              size="sm" className="h-7 px-2.5 text-[11px]"
              disabled={approve.isPending || discard.isPending}
              onClick={() => approve.mutate()}
            >
              {approve.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="mr-1 h-3 w-3" /> Approve &amp; commit</>}
            </Button>
            <Button
              size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-destructive"
              disabled={approve.isPending || discard.isPending}
              onClick={() => discard.mutate()}
            >
              Discard
            </Button>
          </>
        )}
      </div>

      <Sheet open={changesOpen} onOpenChange={setChangesOpen}>
        <SheetContent side="bottom" className="flex h-[85vh] flex-col p-0">
          <SheetHeader className="border-b border-border/60 p-4">
            <SheetTitle>Changes from this run</SheetTitle>
            {run.reviewBranch && (
              <p className="font-mono text-[10px] text-muted-foreground">{run.reviewBranch} → {run.baseBranch}</p>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-3">
            {files.map((f) => (
              <div key={f.path} className="flex items-center gap-2 border-b border-border/40 py-2 font-mono text-[11px]">
                <span className={`w-16 shrink-0 uppercase ${
                  f.status === "added" ? "text-emerald-500" : f.status === "deleted" ? "text-destructive" : "text-amber-500"
                }`}>{f.status}</span>
                <span className="truncate">{f.path}</span>
              </div>
            ))}
            {diff.isLoading && <div className="grid place-items-center py-6"><Loader2 className="h-4 w-4 animate-spin" /></div>}
            {diff.data?.patch && (
              <pre className="mt-3 whitespace-pre-wrap break-words rounded bg-muted/50 p-2 font-mono text-[10px] leading-snug">{diff.data.patch}</pre>
            )}
            {!diff.isLoading && !diff.data?.patch && files.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">No file changes were recorded for this run.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ActivitySheet
        open={activityOpen}
        onOpenChange={setActivityOpen}
        events={(events.data ?? []) as AgentEvent[]}
        phase="done"
        busy={false}
      />
    </div>
  );
}


/* ------------------------------- repo + model ----------------------------- */

function RepoPill({ thread, onChange, onChangeNotebook }: {
  thread: ThreadData;
  onChange: (id: string) => void;
  onChangeNotebook: (id: string) => void;
}) {
  const reposFn = useServerFn(listRepoSelections);
  const notebooksFn = useServerFn(listKaggleNotebooks);
  const [open, setOpen] = useState(false);
  const repos = useQuery({ queryKey: ["repo_selections"], queryFn: () => reposFn(), enabled: open });
  const notebooks = useQuery({ queryKey: ["kaggle_notebooks"], queryFn: () => notebooksFn().catch(() => []), enabled: open });
  const label = thread.kaggle_notebooks
    ? `${thread.kaggle_notebooks.owner}/${thread.kaggle_notebooks.slug}`
    : thread.repo_selections ? `${thread.repo_selections.owner}/${thread.repo_selections.name}` : "no target";
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="mx-auto mt-0.5 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground">
          {thread.kaggle_notebooks ? <NotebookPen className="h-3 w-3" /> : <Github className="h-3 w-3" />}
          <span className="max-w-[180px] truncate">{label}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[70vh]">
        <SheetHeader><SheetTitle>What this chat codes on</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-1 overflow-y-auto">
          {repos.isLoading && <Loader2 className="mx-auto h-4 w-4 animate-spin" />}
          {(repos.data ?? []).length > 0 && (
            <p className="px-3 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">GitHub repos</p>
          )}
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
          {(notebooks.data ?? []).length > 0 && (
            <p className="px-3 pb-1 pt-3 text-[10px] uppercase tracking-wide text-muted-foreground">Kaggle notebooks</p>
          )}
          {(notebooks.data ?? []).map((nb) => (
            <button
              key={nb.id}
              onClick={() => { onChangeNotebook(nb.id); setOpen(false); }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent ${
                nb.id === thread.kaggle_notebook_id ? "bg-accent" : ""
              }`}
            >
              <NotebookPen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate font-mono">{nb.owner}/{nb.slug}</span>
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
  const notebooksFn = useServerFn(listKaggleNotebooks);
  const notebooks = useQuery({ queryKey: ["kaggle_notebooks"], queryFn: () => notebooksFn().catch(() => []), enabled: open });

  const createMut = useMutation({
    mutationFn: (target: { repoId?: string; kaggleNotebookId?: string }) => createFn({ data: target }),
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
            disabled={(!repos.data?.length && !notebooks.data?.length) || createMut.isPending}
            onClick={() => {
              if (repos.data?.[0]) createMut.mutate({ repoId: repos.data[0].id });
              else if (notebooks.data?.[0]) createMut.mutate({ kaggleNotebookId: notebooks.data[0].id });
            }}
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
