import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { unifiedDiff } from "@/lib/diff";

async function creds(sb: { from: (t: string) => any }) {
  const { data } = await sb.from("openrouter_settings")
    .select("kaggle_username, kaggle_key").maybeSingle();
  if (!data?.kaggle_username || !data?.kaggle_key) {
    throw new Error("Add your Kaggle username and API key on the Account tab first.");
  }
  return { username: data.kaggle_username as string, key: data.kaggle_key as string };
}

export const saveKaggleCreds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({
    username: z.string().min(1).max(100),
    key: z.string().min(10).max(500),
  }).parse(i))
  .handler(async ({ context, data }) => {
    const { listKernels } = await import("./kaggle.server");
    await listKernels(data.username, data.key); // validate before saving
    const { data: existing } = await context.supabase
      .from("openrouter_settings").select("model").maybeSingle();
    const { error } = await context.supabase.from("openrouter_settings").upsert({
      user_id: context.userId,
      kaggle_username: data.username,
      kaggle_key: data.key,
      ...(existing ? {} : { model: "anthropic/claude-3.5-sonnet" }),
    });
    if (error) throw error;
    return { ok: true };
  });

export const getKaggleStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("openrouter_settings").select("kaggle_username, kaggle_key").maybeSingle();
    return {
      username: data?.kaggle_username ?? null,
      connected: Boolean(data?.kaggle_username && data?.kaggle_key),
    };
  });

export const listKaggleKernels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { username, key } = await creds(context.supabase as never);
    const { listKernels } = await import("./kaggle.server");
    return (await listKernels(username, key)).map((k) => ({ ref: k.ref, title: k.title }));
  });

export const listKaggleNotebooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("kaggle_notebooks")
      .select("id, owner, slug, title, status, last_synced_at, enable_gpu, enable_internet")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const addKaggleNotebook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ ref: z.string().min(3).max(200) }).parse(i))
  .handler(async ({ context, data }) => {
    const [owner, slug] = data.ref.split("/");
    if (!owner || !slug) throw new Error("Notebook reference must look like username/notebook-slug");
    const { username, key } = await creds(context.supabase as never);
    const { pullKernel } = await import("./kaggle.server");
    const pulled = await pullKernel(username, key, owner, slug);
    const source = pulled.blob?.source ?? "";
    if (!source.trim()) throw new Error("Kaggle returned no source for that notebook. Check the ref (it must be username/slug) and that the notebook exists.");
    const md = pulled.metadata ?? {};
    const { data: row, error } = await context.supabase.from("kaggle_notebooks").upsert({
      user_id: context.userId,
      owner, slug,
      title: md.title ?? slug,
      language: (pulled.blob?.language ?? md.language ?? "python").toLowerCase(),
      kernel_type: (pulled.blob?.kernelType ?? md.kernelType ?? "notebook").toLowerCase(),
      is_private: md.isPrivate ?? true,
      enable_gpu: md.enableGpu ?? false,
      enable_internet: md.enableInternet ?? true,
      dataset_sources: (md.datasetDataSources ?? []) as never,
      original_source: source,
      working_source: source,
      status: "unchanged",
      last_synced_at: new Date().toISOString(),
    }, { onConflict: "user_id,owner,slug" }).select().single();
    if (error) throw error;
    return row;
  });

export const removeKaggleNotebook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("kaggle_notebooks").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Re-pull from Kaggle, discarding staged edits. */
export const syncKaggleNotebook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: nb, error: ne } = await context.supabase
      .from("kaggle_notebooks").select("owner, slug").eq("id", data.id).single();
    if (ne) throw ne;
    const { username, key } = await creds(context.supabase as never);
    const { pullKernel } = await import("./kaggle.server");
    const pulled = await pullKernel(username, key, nb.owner, nb.slug);
    const source = pulled.blob?.source ?? "";
    if (!source) throw new Error("Kaggle returned an empty notebook — refusing to wipe the working copy. The notebook may have been deleted or made private.");
    const { error } = await context.supabase.from("kaggle_notebooks").update({
      original_source: source, working_source: source, status: "unchanged",
      last_synced_at: new Date().toISOString(),
    }).eq("id", data.id);
    if (error) throw error;
    return { ok: true, bytes: source.length };
  });

export const getKaggleStaged = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: nb } = await context.supabase
      .from("kaggle_notebooks")
      .select("id, owner, slug, title, status, working_source, original_source")
      .eq("id", data.id).maybeSingle();
    if (!nb) return null;
    const sourceDirty = nb.status === "modified" && nb.working_source !== nb.original_source;
    return {
      id: nb.id, ref: `${nb.owner}/${nb.slug}`, title: nb.title,
      // Settings-only changes (GPU/internet/datasets/title) also stage a push,
      // so "dirty" must include them — source-only comparison hid the bar and
      // the user had no way to push staged settings.
      dirty: nb.status === "modified",
      sourceDirty,
      bytes: (nb.working_source ?? "").length,
      // Unified patch of the staged source, computed server-side so the client
      // never downloads both full sources.
      patch: sourceDirty ? unifiedDiff(nb.original_source ?? "", nb.working_source ?? "", { maxLines: 300 }) : "",
    };
  });

/** Throw away staged notebook edits: reset the working copy to the last synced source. */
export const discardKaggleStaged = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: nb, error: e } = await context.supabase
      .from("kaggle_notebooks")
      .select("original_source, status")
      .eq("id", data.id).maybeSingle();
    if (e) throw e;
    if (!nb) throw new Error("Notebook not found");
    if (nb.status !== "modified") return { ok: true, discarded: false };
    const { error } = await context.supabase.from("kaggle_notebooks").update({
      working_source: nb.original_source ?? "",
      status: "unchanged",
      updated_at: new Date().toISOString(),
    }).eq("id", data.id);
    if (error) throw error;
    return { ok: true, discarded: true };
  });

/** Push the staged notebook source back to Kaggle (a new version). */
export const pushKaggleNotebook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: nb, error: ne } = await context.supabase
      .from("kaggle_notebooks").select("*").eq("id", data.id).single();
    if (ne) throw ne;
    if (!nb.working_source) throw new Error("Nothing to push — the notebook is not synced.");
    const { username, key } = await creds(context.supabase as never);
    const { pushKernel } = await import("./kaggle.server");
    const result = await pushKernel(username, key, {
      owner: nb.owner, slug: nb.slug, title: nb.title, source: nb.working_source,
      language: nb.language, kernelType: nb.kernel_type, isPrivate: nb.is_private,
      enableGpu: nb.enable_gpu, enableInternet: nb.enable_internet,
      datasetSources: (nb.dataset_sources as string[] | null) ?? [],
    });
    // Kaggle's kernels/push answers HTTP 200 even when it REJECTS the version
    // (validation errors ride in the body as `error` / isComplete=false).
    // Marking the notebook "unchanged" before checking this used to make the
    // app believe the push landed when it didn't.
    const body = (result ?? {}) as { error?: unknown; isComplete?: boolean; version?: number; invalid?: boolean };
    const errText = typeof body.error === "string" && body.error.trim()
      ? body.error
      : body.error ? JSON.stringify(body.error).slice(0, 300) : null;
    if (errText) throw new Error(`Kaggle rejected the push: ${errText}`);
    if (body.isComplete === false || body.invalid === true) {
      throw new Error("Kaggle did not accept the new version (the run was not queued). Check the notebook settings and try again.");
    }
    await context.supabase.from("kaggle_notebooks").update({
      original_source: nb.working_source, status: "unchanged",
      last_synced_at: new Date().toISOString(),
    }).eq("id", data.id);
    return { ok: true, version: typeof body.version === "number" ? body.version : null, url: `https://www.kaggle.com/code/${nb.owner}/${nb.slug}` };
  });
