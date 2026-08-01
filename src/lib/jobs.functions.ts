import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const installCoderWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ repoId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: sel, error } = await context.supabase
      .from("repo_selections").select("*").eq("id", data.repoId).single();
    if (error) throw error;
    if (sel.workflow_installed_at) return { ok: true, alreadyInstalled: true };

    const { data: conn } = await context.supabase
      .from("github_connections").select("access_token, scope").maybeSingle();
    if (!conn) throw new Error("Connect GitHub first");
    const scopes = new Set((conn.scope ?? "").split(/[ ,]+/).filter(Boolean));
    if (!scopes.has("workflow")) {
      throw new Error('Reconnect GitHub from the Account tab to grant the required “workflow” permission, then try again.');
    }

    const { WORKFLOW_YML, RUNNER_MJS } = await import("./workflow-template.server");
    // Use the Contents API (PUT /repos/{owner}/{name}/contents/{path}) — one call per file.
    // It's more forgiving than the tree/commit dance and gives a clearer error when the
    // OAuth token lacks write permissions for the repo (e.g. org repo not authorized).
    const branch = sel.working_branch || sel.default_branch;
    const putFile = async (filePath: string, content: string) => {
      // Look up existing SHA (needed when the file already exists so PUT counts as update).
      let sha: string | undefined;
      const head = await fetch(
        `https://api.github.com/repos/${sel.owner}/${sel.name}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branch)}`,
        { headers: {
          Authorization: `Bearer ${conn.access_token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "coderbot-app",
        } },
      );
      if (head.ok) {
        const j = await head.json() as { sha?: string };
        sha = j.sha;
      }
      const res = await fetch(
        `https://api.github.com/repos/${sel.owner}/${sel.name}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${conn.access_token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "coderbot-app",
          },
          body: JSON.stringify({
            message: `chore: install Lovable coder workflow (${filePath})`,
            content: Buffer.from(content, "utf8").toString("base64"),
            branch,
            ...(sha ? { sha } : {}),
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 404) {
          throw new Error(
            `GitHub 404 writing ${filePath} on ${sel.owner}/${sel.name}@${branch}. ` +
            `Reconnect GitHub to grant the required “workflow” permission. If this is an organization repo, ` +
            `an organization admin may also need to approve the OAuth app. ` +
            `Detail: ${text.slice(0, 200)}`,
          );
        }
        throw new Error(`GitHub ${res.status} writing ${filePath}: ${text.slice(0, 300)}`);
      }
    };
    await putFile(".github/workflows/lovable-coder.yml", WORKFLOW_YML);
    await putFile("scripts/lovable-coder/runner.mjs", RUNNER_MJS);

    await context.supabase.from("repo_selections")
      .update({ workflow_installed_at: new Date().toISOString() })
      .eq("id", data.repoId);
    return { ok: true, alreadyInstalled: false };
  });

export const enqueueCodingJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    threadId: z.string().uuid(),
    prompt: z.string().min(1).max(20000),
  }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: thread, error: te } = await context.supabase
      .from("chat_threads")
      .select("id, model, repo_selection_id, repo_selections(owner, name, working_branch, workflow_installed_at)")
      .eq("id", data.threadId).single();
    if (te) throw te;
    if (!thread.repo_selections) throw new Error("Thread has no repo");
    const repo = thread.repo_selections as { owner: string; name: string; working_branch: string; workflow_installed_at: string | null };
    if (!repo.workflow_installed_at) throw new Error("Install the coder workflow for this repo first");
    if (!thread.model) throw new Error("Pick a model for this chat first");

    const { data: conn } = await context.supabase
      .from("github_connections").select("access_token").maybeSingle();
    if (!conn) throw new Error("Connect GitHub");

    const secret = crypto.randomUUID() + crypto.randomUUID();
    const requestUrl = new URL(getRequest().url);
    const appUrl = `${requestUrl.protocol}//${requestUrl.host}`;

    const { data: job, error: je } = await context.supabase
      .from("coding_jobs").insert({
        user_id: context.userId,
        thread_id: data.threadId,
        repo_selection_id: thread.repo_selection_id,
        status: "queued",
        prompt: data.prompt,
        model: thread.model,
        job_type: "code",
        hmac_secret: secret,
        working_branch: repo.working_branch,
        logs: "",
      }).select().single();
    if (je) throw je;

    // repository_dispatch
    const dispatch = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${conn.access_token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
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
    if (!dispatch.ok) {
      const text = await dispatch.text();
      await context.supabase.from("coding_jobs")
        .update({ status: "failed", error: `dispatch: ${dispatch.status} ${text.slice(0, 400)}` })
        .eq("id", job.id);
      throw new Error(`GitHub dispatch failed: ${dispatch.status}`);
    }

    return { jobId: job.id };
  });

export const getJob = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: job, error } = await context.supabase
      .from("coding_jobs")
      .select("id, status, prompt, logs, error, commit_sha, finished_at, created_at, updated_at")
      .eq("id", data.id).maybeSingle();
    if (error) throw error;
    return job;
  });

export const listJobsForThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ threadId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("coding_jobs")
      .select("id, status, prompt, commit_sha, error, finished_at, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  });

export const cancelJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await context.supabase.from("coding_jobs")
      .update({ status: "failed", error: "cancelled by user", finished_at: new Date().toISOString() })
      .eq("id", data.id).in("status", ["queued", "running"]);
    return { ok: true };
  });

export const enqueueIndexJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    repoId: z.string().uuid(),
    model: z.string().min(1).max(200),
  }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: repo, error: re } = await context.supabase
      .from("repo_selections")
      .select("id, owner, name, working_branch, workflow_installed_at").eq("id", data.repoId).single();
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

    const secret = crypto.randomUUID() + crypto.randomUUID();
    const requestUrl = new URL(getRequest().url);
    const appUrl = `${requestUrl.protocol}//${requestUrl.host}`;

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

    const dispatch = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${conn.access_token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
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
    if (!dispatch.ok) {
      const text = await dispatch.text();
      await context.supabase.from("coding_jobs")
        .update({ status: "failed", error: `dispatch: ${dispatch.status} ${text.slice(0, 400)}` })
        .eq("id", job.id);
      throw new Error(`GitHub dispatch failed: ${dispatch.status}`);
    }
    return { jobId: job.id };
  });

export const getLatestIndexJob = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ repoId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase
      .from("coding_jobs")
      .select("id, status, progress_current, progress_total, error, finished_at, created_at")
      .eq("repo_selection_id", data.repoId).eq("job_type", "index")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    return row;
  });