import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { unifiedDiff, diffStats } from "@/lib/diff";

export const startGithubOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) throw new Error("GitHub OAuth is not configured yet. Ask the app owner to set GITHUB_CLIENT_ID.");
    const { signState } = await import("./oauth-state.server");
    const state = signState({ uid: context.userId, n: crypto.randomUUID() });
    const requestUrl = new URL(getRequest().url);
    const override = process.env.GITHUB_REDIRECT_URI?.trim();
    const redirect = override && override.length > 0
      ? override
      : `${requestUrl.protocol}//${requestUrl.host}/api/github/callback`;
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirect);
    url.searchParams.set("scope", "repo workflow read:user");
    url.searchParams.set("state", state);
    return { url: url.toString() };
  });

export const getGithubConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("github_connections")
      .select("github_login, avatar_url, created_at, scope")
      .maybeSingle();
    return data;
  });

export const disconnectGithub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("github_connections").delete().eq("user_id", context.userId);
    return { ok: true };
  });

export const listUserRepos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: conn, error } = await context.supabase
      .from("github_connections")
      .select("access_token")
      .maybeSingle();
    if (error) throw error;
    if (!conn) throw new Error("Connect GitHub first");
    const { listAllRepos } = await import("./github.server");
    const repos = await listAllRepos(conn.access_token);
    return (repos ?? []).filter(Boolean).map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      owner: r.owner?.login ?? r.full_name?.split("/")[0] ?? "",
      private: r.private,
      default_branch: r.default_branch ?? "main",
      description: r.description,
      updated_at: r.updated_at,
    }));

  });

export const addRepoSelection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({
      github_repo_id: z.number(),
      owner: z.string(),
      name: z.string(),
      default_branch: z.string(),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("repo_selections")
      .upsert({
        user_id: context.userId,
        github_repo_id: data.github_repo_id,
        owner: data.owner,
        name: data.name,
        default_branch: data.default_branch,
        working_branch: data.default_branch,
      }, { onConflict: "user_id,github_repo_id" })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const listRepoSelections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("repo_selections")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const getRepoSelection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("repo_selections")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw error;
    return row;
  });

export const removeRepoSelection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("repo_selections").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const syncRepoFromGithub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ repoId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: sel, error: e1 } = await context.supabase
      .from("repo_selections")
      .select("*")
      .eq("id", data.repoId)
      .single();
    if (e1) throw e1;
    const { data: conn, error: e2 } = await context.supabase
      .from("github_connections")
      .select("access_token")
      .maybeSingle();
    if (e2) throw e2;
    if (!conn) throw new Error("GitHub not connected");

    const { pullRepoFiles } = await import("./github.server");
    const files = await pullRepoFiles(sel.owner, sel.name, sel.working_branch, conn.access_token);

    // Clear existing files (but keep AI-added modifications? For a fresh sync we replace all.)
    await context.supabase.from("working_files").delete().eq("repo_selection_id", data.repoId);

    const rows = files.map((f) => ({
      repo_selection_id: data.repoId,
      user_id: context.userId,
      path: f.path,
      content: f.content,
      original_content: f.content,
      original_sha: f.sha,
      status: "unchanged" as const,
    }));

    // Insert in chunks bounded by SIZE, not just row count: rows carry full
    // file contents (up to 300KB each), so 100 rows could be a ~30MB request
    // body that PostgREST rejects with 413 — which used to leave the working
    // copy half-empty after the delete above.
    const MAX_CHUNK_ROWS = 50;
    const MAX_CHUNK_BYTES = 2 * 1024 * 1024;
    let chunk: typeof rows = [];
    let chunkBytes = 0;
    const flush = async () => {
      if (!chunk.length) return;
      const { error } = await context.supabase.from("working_files").insert(chunk);
      if (error) {
        throw new Error(`Sync failed while writing ${chunk.length} file(s) (${error.message}). Press Sync again to retry — the working copy may be incomplete.`);
      }
      chunk = [];
      chunkBytes = 0;
    };
    for (const row of rows) {
      const rowBytes = (row.content?.length ?? 0) * 2 + 200; // rough UTF-8 estimate
      if (chunk.length && (chunk.length >= MAX_CHUNK_ROWS || chunkBytes + rowBytes > MAX_CHUNK_BYTES)) {
        await flush();
      }
      chunk.push(row);
      chunkBytes += rowBytes;
    }
    await flush();

    await context.supabase
      .from("repo_selections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", data.repoId);

    // Rows were replaced wholesale — drop in-memory caches so the agent's next
    // read/list/search reflects the freshly synced tree, not the old one.
    const { invalidateRepoCaches } = await import("./performance");
    invalidateRepoCaches(data.repoId);

    return { count: rows.length };
  });

export const commitAndPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ repoId: z.string().uuid(), message: z.string().min(1).max(500) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: sel, error: e1 } = await context.supabase
      .from("repo_selections").select("*").eq("id", data.repoId).single();
    if (e1) throw e1;
    const { data: conn, error: e2 } = await context.supabase
      .from("github_connections").select("access_token").maybeSingle();
    if (e2) throw e2;
    if (!conn) throw new Error("GitHub not connected");

    const { data: files, error: e3 } = await context.supabase
      .from("working_files")
      .select("path, content, status")
      .eq("repo_selection_id", data.repoId)
      .neq("status", "unchanged");
    if (e3) throw e3;
    if (!files || files.length === 0) throw new Error("No pending changes");

    const { commitChanges } = await import("./github.server");
    const changes = files.map((f) => ({
      path: f.path,
      content: f.status === "deleted" ? null : (f.content ?? ""),
    }));
    const result = await commitChanges(
      sel.owner, sel.name, sel.working_branch, conn.access_token, changes, data.message,
    );

    // Reset local state for EXACTLY the files that were committed.
    // The old reset did two full-table passes (set original_content = null on
    // every changed row, then rewrite it row-by-row for every row in the repo —
    // hundreds of sequential queries, and a crash in between left nulls).
    const committed = new Set(files.map((f) => f.path));
    const changedRows = files.filter((f) => f.status !== "deleted");
    // Delete rows the commit removed from the repo.
    await context.supabase
      .from("working_files")
      .delete()
      .eq("repo_selection_id", data.repoId)
      .eq("status", "deleted");
    // Mark every remaining staged row unchanged.
    await context.supabase
      .from("working_files")
      .update({ status: "unchanged" })
      .eq("repo_selection_id", data.repoId)
      .neq("status", "unchanged");
    // Sync original_content to the committed content for the committed files,
    // in small parallel batches (per-row values can't be expressed in one
    // PostgREST update).
    const byPath = new Map(changedRows.map((f) => [f.path, f.content ?? ""]));
    const touched = (await context.supabase
      .from("working_files")
      .select("id, path")
      .eq("repo_selection_id", data.repoId)
      .in("path", [...committed])).data ?? [];
    const CHUNK = 20;
    for (let i = 0; i < touched.length; i += CHUNK) {
      const batch = touched.slice(i, i + CHUNK);
      await Promise.all(batch.map((t) =>
        context.supabase
          .from("working_files")
          .update({ original_content: byPath.get(t.path) ?? "" })
          .eq("id", t.id),
      ));
    }

    // Statuses were reset to "unchanged" — expire cached listings/statuses so
    // the next run does not report phantom modified/deleted markers.
    const { invalidateRepoCaches } = await import("./performance");
    invalidateRepoCaches(data.repoId);

    return { sha: result.sha, count: files.length };
  });

/** Unified diff (original vs staged content) of one working file, for review. */
export const getWorkingFileDiff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ repoId: z.string().uuid(), path: z.string().max(400) }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("working_files")
      .select("path, status, content, original_content")
      .eq("repo_selection_id", data.repoId)
      .eq("path", data.path)
      .maybeSingle();
    if (error) throw error;
    if (!row) return { path: data.path, status: "missing", patch: "", added: 0, removed: 0 };
    const before = row.status === "added" ? "" : (row.original_content ?? "");
    const after = row.status === "deleted" ? "" : (row.content ?? "");
    const patch = unifiedDiff(before, after, { maxLines: 300 });
    const stats = diffStats(before, after);
    return { path: row.path, status: row.status, patch, added: stats.added, removed: stats.removed };
  });

/** Throw away staged changes (all of them, or one file) without committing. */
export const discardStagedChanges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ repoId: z.string().uuid(), path: z.string().max(400).optional() }).parse(i))
  .handler(async ({ context, data }) => {
    const staged = await context.supabase
      .from("working_files")
      .select("id, path, status, original_content")
      .eq("repo_selection_id", data.repoId)
      .neq("status", "unchanged");
    if (staged.error) throw staged.error;
    let rows = staged.data ?? [];
    if (data.path) rows = rows.filter((r) => r.path === data.path);
    if (rows.length === 0) return { ok: true, discarded: 0 };

    // Added files: the row is the staging area itself — remove it entirely.
    const addedIds = rows.filter((r) => r.status === "added").map((r) => r.id);
    for (let i = 0; i < addedIds.length; i += 50) {
      const { error } = await context.supabase
        .from("working_files")
        .delete()
        .in("id", addedIds.slice(i, i + 50));
      if (error) throw error;
    }
    // Modified files: restore the last-synced content.
    const restored = rows.filter((r) => r.status === "modified" || r.status === "deleted");
    const CHUNK = 20;
    for (let i = 0; i < restored.length; i += CHUNK) {
      const batch = restored.slice(i, i + CHUNK);
      await Promise.all(batch.map((r) =>
        context.supabase
          .from("working_files")
          .update({ content: r.original_content ?? "", status: "unchanged", updated_at: new Date().toISOString() })
          .eq("id", r.id),
      ));
    }
    return { ok: true, discarded: rows.length };
  });

export const listWorkingFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ repoId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("working_files")
      .select("id, path, status, updated_at")
      .eq("repo_selection_id", data.repoId)
      .order("path");
    if (error) throw error;
    return rows ?? [];
  });

export const getWorkingFile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ repoId: z.string().uuid(), path: z.string() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("working_files")
      .select("*")
      .eq("repo_selection_id", data.repoId)
      .eq("path", data.path)
      .maybeSingle();
    if (error) throw error;
    return row;
  });