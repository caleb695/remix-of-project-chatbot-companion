import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const startGithubOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) throw new Error("GitHub OAuth is not configured yet. Ask the app owner to set GITHUB_CLIENT_ID.");
    const { signState } = await import("./oauth-state.server");
    const state = signState({ uid: context.userId, n: crypto.randomUUID() });
    const requestUrl = new URL(getRequest().url);
    const redirect = `${requestUrl.protocol}//${requestUrl.host}/api/github/callback`;
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
    return repos.map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      owner: r.owner.login,
      private: r.private,
      default_branch: r.default_branch,
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

    // Insert in chunks
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await context.supabase.from("working_files").insert(chunk);
      if (error) throw error;
    }

    await context.supabase
      .from("repo_selections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", data.repoId);

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

    // Reset statuses locally
    await context.supabase
      .from("working_files")
      .delete()
      .eq("repo_selection_id", data.repoId)
      .eq("status", "deleted");
    await context.supabase
      .from("working_files")
      .update({ status: "unchanged", original_content: null })
      .eq("repo_selection_id", data.repoId)
      .neq("status", "unchanged");
    // Then set original_content = content
    const { data: touched } = await context.supabase
      .from("working_files")
      .select("id, content")
      .eq("repo_selection_id", data.repoId);
    if (touched) {
      for (const t of touched) {
        await context.supabase.from("working_files").update({ original_content: t.content }).eq("id", t.id);
      }
    }

    return { sha: result.sha, count: files.length };
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