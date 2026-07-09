import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Suspense, useState } from "react";
import { GitCommit, Plus, RefreshCw, Settings, Trash2, Loader2, FileText, MessageSquare } from "lucide-react";
import { getRepoSelection, syncRepoFromGithub, listWorkingFiles, commitAndPush } from "@/lib/github.functions";
import { listThreads, createThread, deleteThread } from "@/lib/threads.functions";
import { getOpenrouterSettings, saveOpenrouterSettings, listOpenrouterModels } from "@/lib/openrouter.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/repos/$repoId")({
  component: RepoLayout,
});

function RepoLayout() {
  const { repoId } = useParams({ from: "/_authenticated/repos/$repoId" });

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader
        right={
          <Suspense fallback={null}>
            <RepoHeaderActions repoId={repoId} />
          </Suspense>
        }
      />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 shrink-0 border-r border-border/60 bg-sidebar">
          <Suspense fallback={<div className="p-4"><Loader2 className="h-4 w-4 animate-spin" /></div>}>
            <ThreadSidebar repoId={repoId} />
          </Suspense>
        </aside>
        <main className="flex flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
        <aside className="w-72 shrink-0 border-l border-border/60 bg-sidebar">
          <Suspense fallback={null}>
            <FilesSidebar repoId={repoId} />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}

function RepoHeaderActions({ repoId }: { repoId: string }) {
  const qc = useQueryClient();
  const getRepo = useServerFn(getRepoSelection);
  const sync = useServerFn(syncRepoFromGithub);
  const repo = useSuspenseQuery(queryOptions({
    queryKey: ["repo", repoId], queryFn: () => getRepo({ data: { id: repoId } }),
  }));
  const syncMut = useMutation({
    mutationFn: () => sync({ data: { repoId } }),
    onSuccess: (r) => { toast.success(`Synced ${r.count} files`); qc.invalidateQueries({ queryKey: ["files", repoId] }); qc.invalidateQueries({ queryKey: ["repo", repoId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex items-center gap-2">
      <Link to="/repos" className="text-xs text-muted-foreground hover:text-foreground">← repos</Link>
      <span className="font-mono text-sm">{repo.data.owner}/{repo.data.name}</span>
      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
        {repo.data.working_branch}
      </span>
      <Button size="sm" variant="ghost" onClick={() => syncMut.mutate()} disabled={syncMut.isPending}>
        <RefreshCw className={`h-4 w-4 ${syncMut.isPending ? "animate-spin" : ""}`} />
      </Button>
      <SettingsDialog />
      <CommitDialog repoId={repoId} />
    </div>
  );
}

function ThreadSidebar({ repoId }: { repoId: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const listFn = useServerFn(listThreads);
  const createFn = useServerFn(createThread);
  const deleteFn = useServerFn(deleteThread);
  const params = useParams({ strict: false }) as { threadId?: string };

  const threads = useSuspenseQuery(queryOptions({
    queryKey: ["threads", repoId], queryFn: () => listFn({ data: { repoId } }),
  }));

  const createMut = useMutation({
    mutationFn: () => createFn({ data: { repoId } }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["threads", repoId] });
      navigate({ to: "/repos/$repoId/threads/$threadId", params: { repoId, threadId: t.id } });
    },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["threads", repoId] }),
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Threads</span>
        <Button size="icon" variant="ghost" onClick={() => createMut.mutate()} className="h-7 w-7">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {threads.data.length === 0 && (
          <p className="px-2 text-xs text-muted-foreground">No threads yet.</p>
        )}
        {threads.data.map((t) => {
          const active = params.threadId === t.id;
          return (
            <div key={t.id} className={`group flex items-center rounded-md ${active ? "bg-accent" : "hover:bg-accent/50"}`}>
              <Link
                to="/repos/$repoId/threads/$threadId" params={{ repoId, threadId: t.id }}
                className="flex-1 truncate px-3 py-2 text-sm"
              >
                <MessageSquare className="mr-2 inline h-3.5 w-3.5 text-muted-foreground" />
                {t.title}
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); delMut.mutate(t.id); if (active) navigate({ to: "/repos/$repoId", params: { repoId } }); }}
                className="mr-1 rounded p-1 opacity-0 hover:bg-destructive/20 group-hover:opacity-100"
                aria-label="Delete thread"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilesSidebar({ repoId }: { repoId: string }) {
  const listFn = useServerFn(listWorkingFiles);
  const files = useSuspenseQuery(queryOptions({
    queryKey: ["files", repoId], queryFn: () => listFn({ data: { repoId } }),
    refetchInterval: 3000,
  }));

  const pending = files.data.filter((f) => f.status !== "unchanged");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Files</span>
        {pending.length > 0 && (
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
            {pending.length} pending
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3 font-mono text-xs">
        {files.data.length === 0 && (
          <p className="p-2 text-muted-foreground">Sync repo to load files.</p>
        )}
        {files.data.map((f) => (
          <div key={f.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-accent/50">
            <StatusDot status={f.status} />
            <span className="truncate" title={f.path}>{f.path}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "added" ? "bg-[color:var(--status-added)]" :
    status === "modified" ? "bg-[color:var(--status-modified)]" :
    status === "deleted" ? "bg-[color:var(--status-deleted)]" :
    "bg-transparent border border-border";
  return <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />;
}

function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const getFn = useServerFn(getOpenrouterSettings);
  const saveFn = useServerFn(saveOpenrouterSettings);
  const modelsFn = useServerFn(listOpenrouterModels);
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["or_settings"], queryFn: () => getFn(), enabled: open });
  const models = useQuery({ queryKey: ["or_models"], queryFn: () => modelsFn(), enabled: open && !!settings.data?.has_key });

  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState<string>("");

  const currentModel = model || settings.data?.model || "";

  const saveMut = useMutation({
    mutationFn: () => saveFn({ data: { apiKey: apiKey || undefined, model: currentModel } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["or_settings"] }); toast.success("Saved"); setApiKey(""); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost"><Settings className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Model & API key</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="or-key">OpenRouter API key</Label>
            <Input
              id="or-key" type="password"
              placeholder={settings.data?.key_preview ?? "sk-or-…"}
              value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Get one at <a className="underline" href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">openrouter.ai/keys</a>.
              {settings.data?.has_key && " (Leave blank to keep the current key.)"}
            </p>
          </div>
          <div>
            <Label>Model</Label>
            {settings.data?.has_key ? (
              <Select value={currentModel} onValueChange={setModel}>
                <SelectTrigger><SelectValue placeholder="Pick a model" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {models.isLoading && <div className="p-3 text-sm text-muted-foreground">Loading models…</div>}
                  {(models.data ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="font-mono text-xs">{m.id}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="anthropic/claude-3.5-sonnet"
                value={currentModel} onChange={(e) => setModel(e.target.value)}
              />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !currentModel}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CommitDialog({ repoId }: { repoId: string }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("Update from coderbot");
  const qc = useQueryClient();
  const filesFn = useServerFn(listWorkingFiles);
  const commitFn = useServerFn(commitAndPush);
  const files = useQuery({ queryKey: ["files", repoId], queryFn: () => filesFn({ data: { repoId } }) });
  const pending = (files.data ?? []).filter((f) => f.status !== "unchanged");

  const commitMut = useMutation({
    mutationFn: () => commitFn({ data: { repoId, message: msg } }),
    onSuccess: (r) => {
      toast.success(`Pushed ${r.count} files (${r.sha.slice(0, 7)})`);
      qc.invalidateQueries({ queryKey: ["files", repoId] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={pending.length === 0}>
          <GitCommit className="mr-1 h-4 w-4" />
          Commit {pending.length > 0 && `(${pending.length})`}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Commit &amp; push</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Commit message</Label>
            <Textarea rows={2} value={msg} onChange={(e) => setMsg(e.target.value)} />
          </div>
          <div className="max-h-56 overflow-y-auto rounded-md border border-border bg-muted/30 p-2 font-mono text-xs">
            {pending.length === 0 && <p className="p-2 text-muted-foreground">No pending changes.</p>}
            {pending.map((f) => (
              <div key={f.id} className="flex items-center gap-2 py-0.5">
                <StatusDot status={f.status} />
                <span className="uppercase text-[10px] text-muted-foreground">{f.status.slice(0,3)}</span>
                <span>{f.path}</span>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => commitMut.mutate()} disabled={commitMut.isPending || pending.length === 0}>
            {commitMut.isPending ? "Pushing…" : "Commit & push"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}