import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, Suspense } from "react";
import { Github, Plus, ExternalLink, Trash2, Loader2 } from "lucide-react";
import {
  startGithubOAuth, getGithubConnection, disconnectGithub,
  listRepoSelections, listUserRepos, addRepoSelection, removeRepoSelection,
} from "@/lib/github.functions";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/repos")({
  component: ReposPage,
});

const reposQK = ["repo_selections"] as const;
const connQK = ["github_conn"] as const;

function ReposPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Suspense fallback={<div className="p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>}>
        <ReposInner />
      </Suspense>
    </div>
  );
}

function ReposInner() {
  const qc = useQueryClient();
  const getConn = useServerFn(getGithubConnection);
  const listSels = useServerFn(listRepoSelections);
  const startOAuth = useServerFn(startGithubOAuth);
  const disconnect = useServerFn(disconnectGithub);
  const removeSel = useServerFn(removeRepoSelection);

  const conn = useSuspenseQuery(queryOptions({ queryKey: connQK, queryFn: () => getConn() }));
  const sels = useSuspenseQuery(queryOptions({ queryKey: reposQK, queryFn: () => listSels() }));

  const connectMut = useMutation({
    mutationFn: async () => (await startOAuth()).url,
    onSuccess: (url) => { window.location.href = url; },
    onError: (e: Error) => toast.error(e.message),
  });
  const disconnectMut = useMutation({
    mutationFn: () => disconnect(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: connQK }); qc.invalidateQueries({ queryKey: reposQK }); toast.success("GitHub disconnected"); },
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => removeSel({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: reposQK }),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">Repos you've connected for AI chat.</p>
        </div>
        {conn.data ? (
          <div className="flex items-center gap-3 text-sm">
            {conn.data.avatar_url && (
              <img src={conn.data.avatar_url} alt="" className="h-7 w-7 rounded-full" />
            )}
            <span className="font-mono text-muted-foreground">@{conn.data.github_login}</span>
            <Button variant="ghost" size="sm" onClick={() => disconnectMut.mutate()}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button onClick={() => connectMut.mutate()} disabled={connectMut.isPending}>
            <Github className="mr-2 h-4 w-4" />
            {connectMut.isPending ? "Redirecting…" : "Connect GitHub"}
          </Button>
        )}
      </div>

      {conn.data && (
        <div className="mt-6">
          <AddRepoDialog />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {!conn.data && (
          <Card className="border-dashed p-8 text-center">
            <Github className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">Connect GitHub to get started</p>
            <p className="mt-1 text-sm text-muted-foreground">We'll read and (when you commit) write to your repos.</p>
          </Card>
        )}
        {conn.data && sels.data.length === 0 && (
          <Card className="border-dashed p-8 text-center">
            <p className="font-medium">No repos yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Click "Add repo" to pick from your GitHub projects.</p>
          </Card>
        )}
        {sels.data.map((r) => (
          <Card key={r.id} className="flex items-center justify-between p-4">
            <div>
              <Link
                to="/repos/$repoId" params={{ repoId: r.id }}
                className="font-mono text-sm font-medium hover:underline"
              >
                {r.owner}/{r.name}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                branch: {r.working_branch}
                {r.last_synced_at && ` · synced ${new Date(r.last_synced_at).toLocaleString()}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="sm">
                <a href={`https://github.com/${r.owner}/${r.name}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => removeMut.mutate(r.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AddRepoDialog() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const listAll = useServerFn(listUserRepos);
  const add = useServerFn(addRepoSelection);
  const navigate = useNavigate();

  const repos = useQuery({
    queryKey: ["gh_all_repos"],
    queryFn: () => listAll(),
    enabled: open,
  });

  const addMut = useMutation({
    mutationFn: (r: { github_repo_id: number; owner: string; name: string; default_branch: string }) =>
      add({ data: r }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: reposQK });
      setOpen(false);
      navigate({ to: "/repos/$repoId", params: { repoId: row.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (repos.data ?? []).filter((r) =>
    r.full_name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Add repo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pick a repository</DialogTitle>
        </DialogHeader>
        <Input placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="max-h-96 overflow-y-auto">
          {repos.isLoading && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            </div>
          )}
          {repos.error && <p className="p-4 text-sm text-destructive">{(repos.error as Error).message}</p>}
          {filtered.map((r) => (
            <button
              key={r.id}
              className="flex w-full items-start justify-between gap-3 rounded-md p-3 text-left hover:bg-accent"
              onClick={() =>
                addMut.mutate({
                  github_repo_id: r.id,
                  owner: r.owner,
                  name: r.name,
                  default_branch: r.default_branch,
                })
              }
              disabled={addMut.isPending}
            >
              <div className="min-w-0">
                <div className="font-mono text-sm">
                  {r.full_name} {r.private && <span className="ml-1 rounded bg-muted px-1 text-[10px] uppercase text-muted-foreground">private</span>}
                </div>
                {r.description && (
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{r.description}</div>
                )}
              </div>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{r.default_branch}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}