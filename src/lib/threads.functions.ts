import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("chat_threads")
      .select("id, title, updated_at, model, target, repo_selection_id, kaggle_notebook_id, repo_selections(owner, name), kaggle_notebooks(owner, slug, title)")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({
    repoId: z.string().uuid().optional(),
    kaggleNotebookId: z.string().uuid().optional(),
    model: z.string().optional(),
  }).refine((v) => Boolean(v.repoId) !== Boolean(v.kaggleNotebookId), {
    message: "Pick either a repo or a Kaggle notebook",
  }).parse(input))
  .handler(async ({ context, data }) => {
    // If no model passed, use the user's saved default from openrouter_settings
    let model = data.model ?? null;
    if (!model) {
      const { data: s } = await context.supabase
        .from("openrouter_settings").select("model").maybeSingle();
      model = s?.model ?? null;
    }
    const { data: row, error } = await context.supabase
      .from("chat_threads")
      .insert({
        user_id: context.userId,
        repo_selection_id: data.repoId ?? null,
        kaggle_notebook_id: data.kaggleNotebookId ?? null,
        target: data.kaggleNotebookId ? "kaggle" : "github",
        title: "New chat",
        model,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("chat_threads").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const getThreadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ threadId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, parts, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (rows ?? []).map((r) => ({
      id: r.id,
      role: r.role,
      parts: r.parts,
    }));
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("chat_threads").update({ title: data.title }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const getThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("chat_threads")
      .select("id, title, model, mode, seed_summary, target, repo_selection_id, kaggle_notebook_id, repo_selections(owner, name, working_branch, workflow_installed_at), kaggle_notebooks(owner, slug, title, status)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    return row;
  });

export const updateThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      model: z.string().optional(),
      repo_selection_id: z.string().uuid().optional(),
      kaggle_notebook_id: z.string().uuid().optional(),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const patch: {
      model?: string; repo_selection_id?: string | null;
      kaggle_notebook_id?: string | null; target?: string;
    } = {};
    if (data.model !== undefined) patch.model = data.model;
    if (data.repo_selection_id !== undefined) {
      patch.repo_selection_id = data.repo_selection_id;
      patch.kaggle_notebook_id = null;
      patch.target = "github";
    }
    if (data.kaggle_notebook_id !== undefined) {
      patch.kaggle_notebook_id = data.kaggle_notebook_id;
      patch.repo_selection_id = null;
      patch.target = "kaggle";
    }
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await context.supabase
      .from("chat_threads").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });