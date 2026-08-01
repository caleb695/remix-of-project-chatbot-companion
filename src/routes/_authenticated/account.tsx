import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Github, LogOut, Loader2, Search, Plus, Check, ExternalLink, Trash2, KeyRound, Zap } from "lucide-react";
import {
  startGithubOAuth, getGithubConnection, disconnectGithub,
  listRepoSelections, listUserRepos, addRepoSelection, removeRepoSelection,
} from "@/lib/github.functions";
import { installCoderWorkflow } from "@/lib/jobs.functions";
import { enqueueIndexJob, getLatestIndexJob } from "@/lib/jobs.functions";
import { getOpenrouterSettings, saveOpenrouterSettings } from "@/lib/openrouter.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur">
        <h1 className="text-base font-semibold">Account</h1>
        <Button variant="ghost" size="sm" onClick={signOut} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <Suspense fallback={<Loader2 className="h-4 w-4 animate-spin" />}>
          <GithubSection />
        </Suspense>
        <OpenRouterSection />
      </div>
    </div>
  );
}

function GithubSection() {
  const qc = useQueryClient();
  const getConn = useServerFn(getGithubConnection);
  const listSels = useServerFn(listRepoSelections);
  const startOAuth = useServerFn(startGithubOAuth);
  const disconnect = useServerFn(disconnectGithub);
  const removeSel = useServerFn(removeRepoSelection);

  const conn = useSuspenseQuery(queryOptions({ queryKey: ["gh_conn"], queryFn: () => getConn() }));
  const sels = useSuspenseQuery(queryOptions({ queryKey: ["repo_selections"], queryFn: () => listSels() }));

  const connectMut = useMutation({
    mutationFn: async () => (await startOAuth()).url,
    onSuccess: (url) => { window.location.href = url; },
    onError: (e: Error) => toast.error(e.message),
  });
  const disconnectMut = useMutation({
    mutationFn: () => disconnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gh_conn"] });
      qc.invalidateQueries({ queryKey: ["repo_selections"] });
      toast.success("GitHub disconnected");
    },
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => removeSel({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repo_selections"] }),
  });
  const installFn = useServerFn(installCoderWorkflow);
  const installMut = useMutation({
    mutationFn: (id: string) => installFn({ data: { repoId: id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["repo_selections"] }); toast.success("Coder workflow installed"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const hasWorkflowScope = new Set((conn.data?.scope ?? "").split(/[ ,]+/).filter(Boolean)).has("workflow");

  if (!conn.data) {
    return (
      <Card className="p-5 text-center">
        <Github className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-medium">Connect GitHub</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The AI needs access to read and edit your repos.
        </p>
        <Button className="mt-4 w-full" onClick={() => connectMut.mutate()} disabled={connectMut.isPending}>
          <Github className="mr-2 h-4 w-4" />
          {connectMut.isPending ? "Redirecting…" : "Connect GitHub"}
        </Button>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
        {conn.data.avatar_url && <img src={conn.data.avatar_url} alt="" className="h-10 w-10 rounded-full" />}
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-sm">@{conn.data.github_login}</div>
          <div className="text-xs text-muted-foreground">Connected</div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => disconnectMut.mutate()}>Disconnect</Button>
      </div>
      {!hasWorkflowScope && (
        <Card className="border-destructive/40 p-3 text-xs">
          <p className="text-muted-foreground">Reconnect GitHub once to grant permission to install workflow files.</p>
          <Button className="mt-2 w-full" size="sm" variant="outline" onClick={() => connectMut.mutate()} disabled={connectMut.isPending}>
            <Github className="mr-2 h-4 w-4" /> Reconnect GitHub
          </Button>
        </Card>
      )}

      <div className="flex items-center justify-between pt-1">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your repos</h2>
        <AddRepoButton />
      </div>

      {sels.data.length === 0 && (
        <Card className="border-dashed p-4 text-center text-xs text-muted-foreground">
          Add a repo to chat with the AI about it.
        </Card>
      )}
      <div className="space-y-2">
        {sels.data.map((r) => (
          <Card key={r.id} className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="truncate font-mono text-sm">{r.owner}/{r.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">branch: {r.working_branch}</div>
              </div>
              <div className="flex shrink-0 items-center">
                <Button asChild variant="ghost" size="sm">
                  <a href={`https://github.com/${r.owner}/${r.name}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => removeMut.mutate(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {r.workflow_installed_at ? (
              <>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Check className="h-3 w-3 text-primary" /> Coder workflow installed
                </div>
                <IndexRepoRow repoId={r.id} />
              </>
            ) : (
              <Button
                variant="secondary" size="sm" className="w-full"
                disabled={installMut.isPending || !hasWorkflowScope}
                onClick={() => installMut.mutate(r.id)}
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                {installMut.isPending ? "Installing…" : "Install coder workflow"}
              </Button>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}

function IndexRepoRow({ repoId }: { repoId: string }) {
  const qc = useQueryClient();
  const enqueueFn = useServerFn(enqueueIndexJob);
  const getLatestFn = useServerFn(getLatestIndexJob);
  const settingsFn = useServerFn(getOpenrouterSettings);
  const settings = useQuery({ queryKey: ["or_settings"], queryFn: () => settingsFn() });
  const model = settings.data?.model ?? "openai/gpt-5.6-sol";
  const job = useQuery({
    queryKey: ["index_job", repoId],
    queryFn: () => getLatestFn({ data: { repoId } }),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "queued" || s === "running" ? 2500 : false;
    },
  });
  const runMut = useMutation({
    mutationFn: () => enqueueFn({ data: { repoId, model } }),
    onSuccess: () => { toast.success("Indexing started on GitHub Actions"); qc.invalidateQueries({ queryKey: ["index_job", repoId] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const j = job.data;
  const running = j?.status === "queued" || j?.status === "running";
  const cur = j?.progress_current ?? 0;
  const tot = j?.progress_total ?? 0;
  const pct = tot > 0 ? Math.min(100, Math.round((cur / tot) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <Button
        size="sm" variant="outline" className="w-full"
        disabled={running || runMut.isPending || !settings.data || !(
          settings.data.embedding_provider === "mistral" ? settings.data.has_mistral_key
            : settings.data.embedding_provider === "nvidia" ? settings.data.has_nvidia_key
            : settings.data.has_key
        )}
        onClick={() => runMut.mutate()}
        title="Index with your selected embedding provider"
      >
        <Search className="mr-1.5 h-3.5 w-3.5" />
        {running ? `Indexing ${cur}/${tot || "?"}…` :
          j?.status === "completed" ? "Re-index repo" : "Index repo"}
      </Button>
      {running && tot > 0 && (
        <div className="h-1 w-full overflow-hidden rounded bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      {j?.status === "failed" && <p className="text-[10px] text-destructive">{j.error}</p>}
    </div>
  );
}

function AddRepoButton() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const listAll = useServerFn(listUserRepos);
  const add = useServerFn(addRepoSelection);

  const repos = useQuery({
    queryKey: ["gh_all_repos"],
    queryFn: () => listAll(),
    enabled: open,
  });

  const sels = useQuery({
    queryKey: ["repo_selections"],
    // rely on cache; only need shape
  });
  const selectedIds = new Set((sels.data as Array<{ github_repo_id: number }> | undefined ?? []).map((r) => r.github_repo_id));

  const addMut = useMutation({
    mutationFn: (r: { github_repo_id: number; owner: string; name: string; default_branch: string }) =>
      add({ data: r }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repo_selections"] });
      toast.success("Added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (repos.data ?? []).filter((r) => r.full_name.toLowerCase().includes(q.toLowerCase()));

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-3.5 w-3.5" /> Add
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center gap-2 border-b border-border/60 p-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your repos…" className="pl-9" />
        </div>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Done</Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {repos.isLoading && <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>}
        {repos.error && <p className="p-4 text-sm text-destructive">{(repos.error as Error).message}</p>}
        {filtered.map((r) => {
          const already = selectedIds.has(r.id);
          return (
            <button
              key={r.id}
              disabled={already || addMut.isPending}
              onClick={() =>
                addMut.mutate({ github_repo_id: r.id, owner: r.owner, name: r.name, default_branch: r.default_branch })
              }
              className="flex w-full items-center gap-3 rounded-md p-3 text-left hover:bg-accent disabled:opacity-60"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-sm">{r.full_name}</div>
                {r.description && <div className="mt-0.5 truncate text-xs text-muted-foreground">{r.description}</div>}
              </div>
              {already && <Check className="h-4 w-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OpenRouterSection() {
  const qc = useQueryClient();
  const getFn = useServerFn(getOpenrouterSettings);
  const saveFn = useServerFn(saveOpenrouterSettings);
  const settings = useQuery({ queryKey: ["or_settings"], queryFn: () => getFn() });
  const [apiKey, setApiKey] = useState("");
  const [mistralKey, setMistralKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [nvidiaKey, setNvidiaKey] = useState("");
  const [embeddingProvider, setEmbeddingProvider] = useState<"mistral" | "openrouter" | "nvidia">("mistral");
  const [embeddingModel, setEmbeddingModel] = useState("mistral-embed");
  useEffect(() => {
    if (!settings.data) return;
    setEmbeddingProvider(settings.data.embedding_provider as "mistral" | "openrouter" | "nvidia");
    setEmbeddingModel(settings.data.embedding_model);
  }, [settings.data]);
  const currentEmbeddingProvider = embeddingProvider;
  const currentEmbeddingModel = embeddingModel;
  const saveMut = useMutation({
    mutationFn: () => saveFn({
      data: {
        apiKey: apiKey || undefined,
        mistralApiKey: mistralKey || undefined,
        groqApiKey: groqKey || undefined,
        nvidiaApiKey: nvidiaKey || undefined,
        embeddingProvider: currentEmbeddingProvider,
        embeddingModel: currentEmbeddingModel,
        model: settings.data?.model ?? "anthropic/claude-3.5-sonnet",
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["or_settings"] });
      qc.invalidateQueries({ queryKey: ["or_models"] });
      toast.success("Key saved");
      setApiKey("");
      setMistralKey("");
      setGroqKey("");
      setNvidiaKey("");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">API keys</h2>
      <Card className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="or-key" className="flex items-center gap-1.5 text-xs">
            <KeyRound className="h-3 w-3" /> OpenRouter (chat & coding)
          </Label>
          <Input
            id="or-key" type="password"
            value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            placeholder={settings.data?.key_preview ?? "sk-or-…"}
          />
          <p className="text-[11px] text-muted-foreground">
            <a className="underline" href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">Get a key</a>
            {settings.data?.has_key && " · saved"}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mi-key" className="flex items-center gap-1.5 text-xs">
            <KeyRound className="h-3 w-3" /> Mistral (chat, coding & embeddings)
          </Label>
          <Input
            id="mi-key" type="password"
            value={mistralKey} onChange={(e) => setMistralKey(e.target.value)}
            placeholder={settings.data?.mistral_key_preview ?? "…"}
          />
          <p className="text-[11px] text-muted-foreground">
            <a className="underline" href="https://console.mistral.ai/api-keys" target="_blank" rel="noreferrer">Get a key</a>
            {settings.data?.has_mistral_key && " · saved"}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="groq-key" className="flex items-center gap-1.5 text-xs"><KeyRound className="h-3 w-3" /> Groq Cloud (chat & coding)</Label>
          <Input id="groq-key" type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)} placeholder={settings.data?.groq_key_preview ?? "gsk_…"} />
          <p className="text-[11px] text-muted-foreground"><a className="underline" href="https://console.groq.com/keys" target="_blank" rel="noreferrer">Get a key</a>{settings.data?.has_groq_key && " · saved"}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nvidia-key" className="flex items-center gap-1.5 text-xs"><KeyRound className="h-3 w-3" /> NVIDIA NIM (chat, coding & embeddings)</Label>
          <Input id="nvidia-key" type="password" value={nvidiaKey} onChange={(e) => setNvidiaKey(e.target.value)} placeholder={settings.data?.nvidia_key_preview ?? "nvapi-…"} />
          <p className="text-[11px] text-muted-foreground"><a className="underline" href="https://build.nvidia.com/settings/api-keys" target="_blank" rel="noreferrer">Get a key</a>{settings.data?.has_nvidia_key && " · saved"}</p>
        </div>
        <div className="space-y-2 border-t border-border pt-4">
          <Label className="text-xs">Repository embeddings</Label>
          <Select value={currentEmbeddingProvider} onValueChange={(value) => {
            const provider = value as "mistral" | "openrouter" | "nvidia";
            setEmbeddingProvider(provider);
            setEmbeddingModel(provider === "mistral" ? "mistral-embed" : provider === "nvidia" ? "nvidia/nv-embedqa-e5-v5" : "openai/text-embedding-3-small");
          }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mistral">Mistral</SelectItem>
              <SelectItem value="openrouter">OpenRouter</SelectItem>
              <SelectItem value="nvidia">NVIDIA NIM</SelectItem>
            </SelectContent>
          </Select>
          <Input value={currentEmbeddingModel} onChange={(e) => setEmbeddingModel(e.target.value)} placeholder="Embedding model ID" />
          <p className="text-[11px] text-muted-foreground">Use a 1024-dimension embedding model to match the repository index.</p>
        </div>
        <div className="flex justify-end">
          <Button size="sm" disabled={(!apiKey && !mistralKey && !groqKey && !nvidiaKey && currentEmbeddingProvider === settings.data?.embedding_provider && currentEmbeddingModel === settings.data?.embedding_model) || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </Card>
    </section>
  );
}