import { c as createServerFn } from "./createServerFn-BFFE07zL.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-UH_Jp6hR.mjs";
import { Ft as stringType, Pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { t as createServerRpc } from "./createServerRpc-MBa5GZ-L.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/threads.functions-BHTylYQQ.js
var listThreads_createServerFn_handler = createServerRpc({
	id: "ebbbc99857ac917fa22c2b1d438323ae8fd03205b61e4f2e84e349f57ca98c3c",
	name: "listThreads",
	filename: "src/lib/threads.functions.ts"
}, (opts) => listThreads.__executeServer(opts));
var listThreads = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listThreads_createServerFn_handler, async ({ context }) => {
	const { data: rows, error } = await context.supabase.from("chat_threads").select("id, title, updated_at, model, target, repo_selection_id, kaggle_notebook_id, repo_selections(owner, name), kaggle_notebooks(owner, slug, title)").order("updated_at", { ascending: false });
	if (error) throw error;
	return rows ?? [];
});
var createThread_createServerFn_handler = createServerRpc({
	id: "67dca520864171111cdf48efef1043d4a0da2d685a1c0b4280bd5013be4b79c9",
	name: "createThread",
	filename: "src/lib/threads.functions.ts"
}, (opts) => createThread.__executeServer(opts));
var createThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	repoId: stringType().uuid().optional(),
	kaggleNotebookId: stringType().uuid().optional(),
	model: stringType().optional()
}).refine((v) => Boolean(v.repoId) !== Boolean(v.kaggleNotebookId), { message: "Pick either a repo or a Kaggle notebook" }).parse(input)).handler(createThread_createServerFn_handler, async ({ context, data }) => {
	let model = data.model ?? null;
	if (!model) {
		const { data: s } = await context.supabase.from("openrouter_settings").select("model").maybeSingle();
		model = s?.model ?? null;
	}
	const { data: row, error } = await context.supabase.from("chat_threads").insert({
		user_id: context.userId,
		repo_selection_id: data.repoId ?? null,
		kaggle_notebook_id: data.kaggleNotebookId ?? null,
		target: data.kaggleNotebookId ? "kaggle" : "github",
		title: "New chat",
		model
	}).select().single();
	if (error) throw error;
	return row;
});
var deleteThread_createServerFn_handler = createServerRpc({
	id: "568557aff3b98c509b2e18e3b33bc94e0f42eaf3bf5efa80b0f9c8e64ed87602",
	name: "deleteThread",
	filename: "src/lib/threads.functions.ts"
}, (opts) => deleteThread.__executeServer(opts));
var deleteThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(deleteThread_createServerFn_handler, async ({ context, data }) => {
	const { error } = await context.supabase.from("chat_threads").delete().eq("id", data.id);
	if (error) throw error;
	return { ok: true };
});
var getThreadMessages_createServerFn_handler = createServerRpc({
	id: "4de48302a58b8017a3864af8f5d4bfff1891bb7bbd691f1f10fb1c616272eab8",
	name: "getThreadMessages",
	filename: "src/lib/threads.functions.ts"
}, (opts) => getThreadMessages.__executeServer(opts));
var getThreadMessages = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ threadId: stringType().uuid() }).parse(input)).handler(getThreadMessages_createServerFn_handler, async ({ context, data }) => {
	const { data: rows, error } = await context.supabase.from("chat_messages").select("id, role, parts, created_at").eq("thread_id", data.threadId).order("created_at", { ascending: true });
	if (error) throw error;
	return (rows ?? []).map((r) => ({
		id: r.id,
		role: r.role,
		parts: r.parts
	}));
});
var renameThread_createServerFn_handler = createServerRpc({
	id: "56b694316d1e17dc10b8d6d407eefbb0620bf9f9d0f5024d355b930910c4496c",
	name: "renameThread",
	filename: "src/lib/threads.functions.ts"
}, (opts) => renameThread.__executeServer(opts));
var renameThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	title: stringType().min(1).max(200)
}).parse(input)).handler(renameThread_createServerFn_handler, async ({ context, data }) => {
	const { error } = await context.supabase.from("chat_threads").update({ title: data.title }).eq("id", data.id);
	if (error) throw error;
	return { ok: true };
});
var getThread_createServerFn_handler = createServerRpc({
	id: "d3b5c99710bd28fef85ba35dd8e9416271f29ded53625108faccb3089c6e0da5",
	name: "getThread",
	filename: "src/lib/threads.functions.ts"
}, (opts) => getThread.__executeServer(opts));
var getThread = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(getThread_createServerFn_handler, async ({ context, data }) => {
	const { data: row, error } = await context.supabase.from("chat_threads").select("id, title, model, mode, seed_summary, target, repo_selection_id, kaggle_notebook_id, repo_selections(owner, name, working_branch, workflow_installed_at), kaggle_notebooks(owner, slug, title, status)").eq("id", data.id).maybeSingle();
	if (error) throw error;
	return row;
});
var updateThread_createServerFn_handler = createServerRpc({
	id: "e2cbd8565bebfb0e0cfaed95334191009cced99011fd393abbc97ae678ff4cee",
	name: "updateThread",
	filename: "src/lib/threads.functions.ts"
}, (opts) => updateThread.__executeServer(opts));
var updateThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	model: stringType().optional(),
	repo_selection_id: stringType().uuid().optional(),
	kaggle_notebook_id: stringType().uuid().optional()
}).parse(input)).handler(updateThread_createServerFn_handler, async ({ context, data }) => {
	const patch = {};
	if (data.model !== void 0) patch.model = data.model;
	if (data.repo_selection_id !== void 0) {
		patch.repo_selection_id = data.repo_selection_id;
		patch.kaggle_notebook_id = null;
		patch.target = "github";
	}
	if (data.kaggle_notebook_id !== void 0) {
		patch.kaggle_notebook_id = data.kaggle_notebook_id;
		patch.repo_selection_id = null;
		patch.target = "kaggle";
	}
	if (Object.keys(patch).length === 0) return { ok: true };
	const { error } = await context.supabase.from("chat_threads").update(patch).eq("id", data.id);
	if (error) throw error;
	return { ok: true };
});
//#endregion
export { createThread_createServerFn_handler, deleteThread_createServerFn_handler, getThreadMessages_createServerFn_handler, getThread_createServerFn_handler, listThreads_createServerFn_handler, renameThread_createServerFn_handler, updateThread_createServerFn_handler };
