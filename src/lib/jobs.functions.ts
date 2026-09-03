import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ghFetch } from "@/lib/github.server";
import { z } from "zod";

const contentsPath = (owner: string, name: string, filePath: string) =>
  `/repos/${owner}/${name}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`;

/** Get the public app URL for runner callbacks. Prefer explicit env var, fallback to request origin. */
export function getAppUrl(request?: Request): string {
  // Explicit public URL (required for GitHub Actions runner to reach the app)
  if (process.env.VITE_PUBLIC_APP_URL) return process.env.VITE_PUBLIC_APP_URL;
  // Fallback: derive from request (works for local/production if request comes from public URL)
  if (request) {
    const requestUrl = new URL(request.url);
    return `${requestUrl.protocol}//${requestUrl.host}`;
  }
  // No request context available (e.g., background job) - this will fail if VITE_PUBLIC_APP_URL is not set
  throw new Error("VITE_PUBLIC_APP_URL environment variable is required for background jobs");
}

/** Write a file into the user's repo through the Contents API. */
async function putRepoFile(args: {
  token: string;
  owner: string;
  name: string;
  branch: string;
  path: string;
  content: string;
  message: string;
}) {
  // Look up existing SHA (needed when the file already exists so PUT counts as update).
  let sha: string | undefined;
  try {
    const head = await ghFetch<{ sha?: string }>(
      `${contentsPath(args.owner, args.name, args.path)}?ref=${encodeURIComponent(args.branch)}`,
      args.token,
    );
    sha = head.sha;
  } catch {
    /* 404 means the file does not exist yet — that's fine, the PUT creates it. */
  }
  try {
    await ghFetch(contentsPath(args.owner, args.name, args.path), args.token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: args.message,
        content: Buffer.from(args.content, "utf8").toString("base64"),
        branch: args.branch,
        ...(sha ? { sha } : {}),
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/GitHub 404/.test(msg)) {
      throw new Error(
        `GitHub 404 writing ${args.path} on ${args.owner}/${args.name}@${args.branch}. ` +
        `Reconnect GitHub to grant the required “workflow” permission. If this is an organization repo, ` +
        `an organization admin may also need to approve the OAuth app. ` +
        `Detail: ${msg.slice(0, 200)}`,
      );
    }
    throw e;
  }
}

/**
 * Repos keep their own copy of the runner, so a runner fix only reaches them
 * when the files are rewritten. Compare the version stamped in the installed
 * workflow and refresh both files when it is behind.
 */
const WORKFLOW_PATH = ".github/workflows/lovable-coder.yml";
const RUNNER_PATH = "scripts/lovable-coder/runner.mjs";

/**
 * GitHub only starts a `repository_dispatch` workflow when the workflow file
 * exists on the repository's DEFAULT branch — a copy that lives only on the
 * working branch is accepted by the dispatch API (204) and then silently never
 * runs ("the runner isn't starting"). So the workflow + runner are written to
 * the default branch as well as the branch the job checks out.
 */
function installBranches(defaultBranch: string, workingBranch: string) {
  const branches = [defaultBranch || workingBranch];
  if (workingBranch && workingBranch !== branches[0]) branches.push(workingBranch);
  return branches;
}

async function writeRunnerFiles(args: {
  token: string;
  owner: string;
  name: string;
  branches: string[];
  message: string;
  workflow: string;
  runner: string;
}) {
  for (const branch of args.branches) {
    const base = { token: args.token, owner: args.owner, name: args.name, branch, message: args.message };
    await putRepoFile({ ...base, path: WORKFLOW_PATH, content: args.workflow });
    await putRepoFile({ ...base, path: RUNNER_PATH, content: args.runner });
  }
}

async function refreshRunnerIfStale(args: {
  token: string;
  owner: string;
  name: string;
  branch: string;
  defaultBranch: string;
}) {
  const { WORKFLOW_YML, RUNNER_MJS, RUNNER_VERSION } = await import("./workflow-template.server");
  const branches = installBranches(args.defaultBranch, args.branch);
  // A transient failure here must not abort the run; fall back to "not stale".
  const versionOn = async (branch: string) =>
    ghFetch<string>(
      `${contentsPath(args.owner, args.name, WORKFLOW_PATH)}?ref=${encodeURIComponent(branch)}`,
      args.token,
      { headers: { Accept: "application/vnd.github.raw+json" } },
    ).then((t) => Number(/runner version (\d+)/.exec(String(t))?.[1] ?? 0)).catch(() => 0);
  const versions = await Promise.all(branches.map(versionOn));
  const stale = branches.filter((_, i) => versions[i] < RUNNER_VERSION);
  if (!stale.length) return;
  await writeRunnerFiles({
    token: args.token,
    owner: args.owner,
    name: args.name,
    branches: stale,
    message: `chore: update Lovable coder runner to v${RUNNER_VERSION}`,
    workflow: WORKFLOW_YML,
    runner: RUNNER_MJS,
  });
}

export const installCoderWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ repoId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: sel, error } = await context.supabase
      .from("repo_selections").select("*").eq("id", data.repoId).single();
    if (error) throw error;

    const { data: conn } = await context.supabase
      .from("github_connections").select("access_token, scope").maybeSingle();
    if (!conn) throw new Error("Connect GitHub first");
    const scopes = new Set((conn.scope ?? "").split(/[ ,]+/).filter(Boolean));
    if (!scopes.has("workflow")) {
      throw new Error('Reconnect GitHub from the Account tab to grant the required “workflow” permission, then try again.');
    }

    // Always (re)write the files so installs also pick up runner updates.
    // Use the Contents API (PUT /repos/{owner}/{name}/contents/{path}) — one call per file.
    // It's more forgiving than the tree/commit dance and gives a clearer error when the
    // OAuth token lacks write permissions for the repo (e.g. org repo not authorized).
    const { WORKFLOW_YML, RUNNER_MJS } = await import("./workflow-template.server");
    // Written to the default branch (required for repository_dispatch to fire)
    // and to the working branch the job checks out.
    await writeRunnerFiles({
      token: conn.access_token,
      owner: sel.owner,
      name: sel.name,
      branches: installBranches(sel.default_branch, sel.working_branch),
      message: "chore: install Lovable coder workflow",
      workflow: WORKFLOW_YML,
      runner: RUNNER_MJS,
    });

    await context.supabase.from("repo_selections")
      .update({ workflow_installed_at: new Date().toISOString() })
      .eq("id", data.repoId);
    return { ok: true, alreadyInstalled: false };
  });

export const enqueueCodingJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({
    threadId: z.string().uuid(),
    prompt: z.string().min(1).max(20000),
    mode: z.enum(["plan", "build", "debug", "improve"]).optional(),
    taskId: z.string().optional(),
  }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: thread, error: te } = await context.supabase
      .from("chat_threads")
      .select("id, title, model, mode, repo_selection_id, repo_selections(owner, name, working_branch, default_branch, workflow_installed_at)")
      .eq("id", data.threadId).single();
    if (te) throw te;
    if (!thread.repo_selections) throw new Error("Thread has no repo");
    const repo = thread.repo_selections as { owner: string; name: string; working_branch: string; default_branch: string; workflow_installed_at: string | null };
    if (!repo.workflow_installed_at) throw new Error("Install the coder workflow for this repo first");
    if (!thread.model) throw new Error("Pick a model for this chat first");

    const { data: conn } = await context.supabase
      .from("github_connections").select("access_token").maybeSingle();
    if (!conn) throw new Error("Connect GitHub");

    const mode = data.mode ?? ((thread.mode as string) || "build");
    const taskId = data.taskId ?? crypto.randomUUID();

    // Persist the user's turn so it survives closing the tab, and title new chats.
    await context.supabase.from("chat_messages").insert({
      thread_id: data.threadId,
      user_id: context.userId,
      role: "user",
      parts: [{ type: "text", text: data.prompt }],
    });
    if (thread.title === "New chat") {
      await context.supabase.from("chat_threads")
        .update({ title: data.prompt.slice(0, 60) }).eq("id", data.threadId);
    }
    await context.supabase.from("agent_events").insert({
      user_id: context.userId,
      thread_id: data.threadId,
      task_id: taskId,
      agent_id: "main",
      agent_label: "Main agent",
      phase: "planning",
      kind: "status",
      text: "Queued on GitHub Actions — you can close this tab, the run continues.",
    });

    // A repo installed before a runner fix would otherwise keep running the old copy.
    try {
      await refreshRunnerIfStale({
        token: conn.access_token,
        owner: repo.owner,
        name: repo.name,
        branch: repo.working_branch,
        defaultBranch: repo.default_branch,
      });
    } catch {
      /* best-effort — run with whatever is installed */
    }

    const secret = crypto.randomUUID() + crypto.randomUUID();
    const appUrl = getAppUrl(getRequest()); // Pass request for fallback when VITE_PUBLIC_APP_URL not set

    const { data: job, error: je } = await context.supabase
      .from("coding_jobs").insert({
        user_id: context.userId,
        thread_id: data.threadId,
        repo_selection_id: thread.repo_selection_id!,
        status: "queued",
        prompt: data.prompt,
        model: thread.model,
        job_type: "code",
        mode,
        task_id: taskId,
        hmac_secret: secret,
        working_branch: repo.working_branch,
        logs: "",
      }).select().single();
    if (je) throw je;

    // repository_dispatch — ghFetch retries transient network/5xx failures so a
    // dropped connection no longer aborts the edit with a raw error.
    try {
      await ghFetch(`/repos/${repo.owner}/${repo.name}/dispatches`, conn.access_token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "lovable-coding-job",
          client_payload: {
            job_id: job.id,
            job_secret: secret,
            app_url: appUrl,
            working_branch: repo.working_branch,
          },
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await context.supabase.from("coding_jobs")
        .update({ status: "failed", error: `dispatch: ${msg.slice(0, 400)}` })
        .eq("id", job.id);
      throw new Error(`GitHub dispatch failed: ${msg.slice(0, 200)}`);
    }

    return { jobId: job.id, taskId };
  });

export const getJob = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: job, error } = await context.supabase
      .from("coding_jobs")
      .select("id, status, prompt, logs, error, summary, commit_sha, review_branch, changed_files, working_branch, task_id, job_type, finished_at, created_at, updated_at")
      .eq("id", data.id).maybeSingle();
    if (error) throw error;
    // A dispatch can be accepted by GitHub but never start the workflow (missing
    // or misconfigured workflow file). Don't leave the UI spinning forever.
    if (job && job.status === "queued" && Date.now() - new Date(job.created_at).getTime() > 6 * 60 * 1000) {
      const message = "The GitHub Actions runner never started this job. Re-install the workflow from Account, then try again.";
      await context.supabase.from("coding_jobs")
        .update({ status: "failed", error: message, finished_at: new Date().toISOString() })
        .eq("id", job.id);
      return { ...job, status: "failed", error: message };
    }
    // Kaggle runs stream in-page; if the tab closed the stream is gone. Don't
    // leave the job spinning forever — staged notebook edits are already saved,
    // so surface the partial result and let the user re-run if needed.
    // Heartbeat runs every 30s in chat.ts, so use a longer timeout (15 min)
    // to account for long model generations without tool calls.
    if (job && job.job_type === "kaggle" && job.status === "running"
        && Date.now() - new Date(job.updated_at).getTime() > 15 * 60 * 1000) {
      const message = "The run stopped when the tab was closed. Any notebook edits made so far are staged — review them and re-run if needed.";
      await context.supabase.from("coding_jobs")
        .update({ status: "failed", error: message, finished_at: new Date().toISOString() })
        .eq("id", job.id);
      return { ...job, status: "failed", error: message };
    }
    return job;
  });

/** The full patch the run produced, for the review screen. */
export const getJobDiff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: job, error } = await context.supabase
      .from("coding_jobs").select("diff, changed_files, review_branch").eq("id", data.id).maybeSingle();
    if (error) throw error;
    const diff = (job?.diff ?? {}) as { patch?: string };
    return {
      patch: diff.patch ?? "",
      files: (job?.changed_files ?? []) as Array<{ path: string; status: string }>,
      review_branch: job?.review_branch ?? null,
    };
  });

/** Merge the run's review branch into the working branch — the user's approval. */
export const approveJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: job, error } = await context.supabase
      .from("coding_jobs")
      .select("id, status, review_branch, working_branch, repo_selection_id, summary")
      .eq("id", data.id).single();
    if (error) throw error;
    if (!job.review_branch) throw new Error("This run has nothing to approve");

    const { data: sel } = await context.supabase
      .from("repo_selections").select("owner, name, working_branch").eq("id", job.repo_selection_id).single();
    const { data: conn } = await context.supabase
      .from("github_connections").select("access_token").maybeSingle();
    if (!sel || !conn?.access_token) throw new Error("Connect GitHub first");

    const base = job.working_branch || sel.working_branch;
    // ghFetch retries transient failures and returns null for a 204 (no-op merge).
    let merged: string | null = null;
    try {
      const res = await ghFetch<{ sha?: string } | null>(
        `/repos/${sel.owner}/${sel.name}/merges`, conn.access_token,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base,
            head: job.review_branch,
            commit_message: `Coderbot: ${job.summary?.slice(0, 60) ?? "approved changes"}`,
          }),
        },
      );
      merged = res?.sha ?? null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/GitHub 409/.test(msg)) throw new Error("GitHub reported a merge conflict with " + base + ". Resolve it on the branch " + job.review_branch + ".");
      throw new Error(`GitHub merge failed: ${msg.slice(0, 200)}`);
    }

    await ghFetch(`/repos/${sel.owner}/${sel.name}/git/refs/heads/${job.review_branch}`, conn.access_token, {
      method: "DELETE",
    }).catch(() => {});

    await context.supabase.from("coding_jobs")
      .update({ status: "completed", commit_sha: merged, review_branch: null, updated_at: new Date().toISOString() })
      .eq("id", job.id);
    return { ok: true, sha: merged, base };
  });

/** Throw the run's changes away without touching the working branch. */
export const discardJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: job, error } = await context.supabase
      .from("coding_jobs").select("id, review_branch, repo_selection_id").eq("id", data.id).single();
    if (error) throw error;
    const { data: sel } = await context.supabase
      .from("repo_selections").select("owner, name").eq("id", job.repo_selection_id).single();
    const { data: conn } = await context.supabase
      .from("github_connections").select("access_token").maybeSingle();
    if (job.review_branch && sel && conn?.access_token) {
      await ghFetch(`/repos/${sel.owner}/${sel.name}/git/refs/heads/${job.review_branch}`, conn.access_token, {
        method: "DELETE",
      }).catch(() => {});
    }
    await context.supabase.from("coding_jobs")
      .update({ status: "discarded", review_branch: null, updated_at: new Date().toISOString() })
      .eq("id", job.id);
    return { ok: true };
  });



export const listJobsForThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ threadId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("coding_jobs")
      .select("id, status, prompt, task_id, commit_sha, error, finished_at, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

export const cancelJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await context.supabase.from("coding_jobs")
      .update({ status: "failed", error: "cancelled by user", finished_at: new Date().toISOString() })
      .eq("id", data.id).in("status", ["queued", "running"]);
    return { ok: true };
  });

export const enqueueIndexJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({
    repoId: z.string().uuid(),
    model: z.string().min(1).max(200),
  }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: repo, error: re } = await context.supabase
      .from("repo_selections")
      .select("id, owner, name, working_branch, default_branch, workflow_installed_at").eq("id", data.repoId).single();
    if (re) throw re;
    if (!repo.workflow_installed_at) throw new Error("Install the coder workflow for this repo first");

    const { data: or } = await context.supabase
      .from("openrouter_settings")
      .select("api_key, mistral_api_key, groq_api_key, nvidia_api_key, embedding_provider")
      .maybeSingle();
    if (!or) throw new Error("Add an AI provider key on the Account tab first");
    const provider = data.model.startsWith("mistral:") ? "mistral"
      : data.model.startsWith("groq:") ? "groq"
      : data.model.startsWith("nvidia:") ? "nvidia"
      : "openrouter";
    const chatKey = provider === "mistral" ? or.mistral_api_key
      : provider === "groq" ? or.groq_api_key
      : provider === "nvidia" ? or.nvidia_api_key
      : or.api_key;
    const embeddingKey = or.embedding_provider === "mistral" ? or.mistral_api_key
      : or.embedding_provider === "nvidia" ? or.nvidia_api_key
      : or.api_key;
    if (!chatKey) throw new Error(`Add your ${provider} API key first`);
    if (!embeddingKey) throw new Error(`Add your ${or.embedding_provider} API key for repository embeddings`);

    const { data: conn } = await context.supabase
      .from("github_connections").select("access_token").maybeSingle();
    if (!conn) throw new Error("Connect GitHub");

    // Keep the workflow on the default branch current — repository_dispatch
    // only fires for the copy that lives there.
    try {
      await refreshRunnerIfStale({
        token: conn.access_token,
        owner: repo.owner,
        name: repo.name,
        branch: repo.working_branch,
        defaultBranch: repo.default_branch,
      });
    } catch { /* best-effort */ }

    const secret = crypto.randomUUID() + crypto.randomUUID();
    const appUrl = getAppUrl(getRequest()); // Pass request for fallback when VITE_PUBLIC_APP_URL not set

    const { data: job, error: je } = await context.supabase
      .from("coding_jobs").insert({
        user_id: context.userId,
        thread_id: null,
        repo_selection_id: repo.id,
        status: "queued",
        prompt: "Index repository",
        model: data.model,
        job_type: "index",
        hmac_secret: secret,
        working_branch: repo.working_branch,
        logs: "",
      }).select().single();
    if (je) throw je;

    try {
      await ghFetch(`/repos/${repo.owner}/${repo.name}/dispatches`, conn.access_token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "lovable-coding-job",
          client_payload: {
            job_id: job.id,
            job_secret: secret,
            app_url: appUrl,
            working_branch: repo.working_branch,
          },
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await context.supabase.from("coding_jobs")
        .update({ status: "failed", error: `dispatch: ${msg.slice(0, 400)}` })
        .eq("id", job.id);
      throw new Error(`GitHub dispatch failed: ${msg.slice(0, 200)}`);
    }
    return { jobId: job.id };
  });

export const getLatestIndexJob = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ repoId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase
      .from("coding_jobs")
      .select("id, status, progress_current, progress_total, error, finished_at, created_at")
      .eq("repo_selection_id", data.repoId).eq("job_type", "index")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    return row;
  });