import { c as createServerFn } from "./createServerFn-BFFE07zL.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-UH_Jp6hR.mjs";
import { Ft as stringType, Mt as enumType, Pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { t as createServerRpc } from "./createServerRpc-MBa5GZ-L.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agent.functions-BiXDgA7w.js
var listAgentEvents_createServerFn_handler = createServerRpc({
	id: "288462ad7884126a87debca8b31147e6110d6668283b715e981a8d95e0a8abb7",
	name: "listAgentEvents",
	filename: "src/lib/agent.functions.ts"
}, (opts) => listAgentEvents.__executeServer(opts));
var listAgentEvents = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator((i) => objectType({
	threadId: stringType().uuid(),
	taskId: stringType().optional()
}).parse(i)).handler(listAgentEvents_createServerFn_handler, async ({ context, data }) => {
	let q = context.supabase.from("agent_events").select("id, task_id, agent_id, agent_label, phase, kind, text, created_at").eq("thread_id", data.threadId).order("created_at", { ascending: true });
	if (data.taskId) q = q.eq("task_id", data.taskId);
	const { data: rows, error } = await q.limit(500);
	if (error) throw error;
	return rows ?? [];
});
var getLatestTask_createServerFn_handler = createServerRpc({
	id: "9430de960e752747d7c46ee43b77efae47a49be180f0d36295eec8a54e8eaea6",
	name: "getLatestTask",
	filename: "src/lib/agent.functions.ts"
}, (opts) => getLatestTask.__executeServer(opts));
var getLatestTask = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ threadId: stringType().uuid() }).parse(i)).handler(getLatestTask_createServerFn_handler, async ({ context, data }) => {
	const { data: row } = await context.supabase.from("agent_events").select("task_id, phase, created_at").eq("thread_id", data.threadId).order("created_at", { ascending: false }).limit(1).maybeSingle();
	return row;
});
var getStagedChanges_createServerFn_handler = createServerRpc({
	id: "4983867db0247d965a872534a133288c6795a860553192332c3bf5a0051a13e8",
	name: "getStagedChanges",
	filename: "src/lib/agent.functions.ts"
}, (opts) => getStagedChanges.__executeServer(opts));
var getStagedChanges = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ repoId: stringType().uuid() }).parse(i)).handler(getStagedChanges_createServerFn_handler, async ({ context, data }) => {
	const { data: rows, error } = await context.supabase.from("working_files").select("path, status, updated_at").eq("repo_selection_id", data.repoId).neq("status", "unchanged").order("path");
	if (error) throw error;
	return rows ?? [];
});
var setThreadMode_createServerFn_handler = createServerRpc({
	id: "48ed0446c7ce24bd908309dad1d50cb7bd9508f10d4dce9ea2f819a7e4c94632",
	name: "setThreadMode",
	filename: "src/lib/agent.functions.ts"
}, (opts) => setThreadMode.__executeServer(opts));
var setThreadMode = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((i) => objectType({
	id: stringType().uuid(),
	mode: enumType([
		"plan",
		"build",
		"debug",
		"improve"
	])
}).parse(i)).handler(setThreadMode_createServerFn_handler, async ({ context, data }) => {
	const { error } = await context.supabase.from("chat_threads").update({ mode: data.mode }).eq("id", data.id);
	if (error) throw error;
	return { ok: true };
});
var branchThread_createServerFn_handler = createServerRpc({
	id: "38e5bc3845ba7eda197af9334fee81f5bc253908490f5562593d780d1c132ad4",
	name: "branchThread",
	filename: "src/lib/agent.functions.ts"
}, (opts) => branchThread.__executeServer(opts));
var branchThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ threadId: stringType().uuid() }).parse(i)).handler(branchThread_createServerFn_handler, async ({ context, data }) => {
	const { data: thread, error: te } = await context.supabase.from("chat_threads").select("id, title, model, mode, repo_selection_id, seed_summary").eq("id", data.threadId).single();
	if (te) throw te;
	const { data: msgs } = await context.supabase.from("chat_messages").select("role, parts").eq("thread_id", data.threadId).order("created_at", { ascending: true }).limit(400);
	const partsText = (parts) => Array.isArray(parts) ? parts.map((p) => p?.type === "text" ? p.text ?? "" : "").join("") : "";
	const transcript = (msgs ?? []).map((m) => `${m.role.toUpperCase()}: ${partsText(m.parts)}`).filter((l) => l.length > 12).join("\n\n").slice(-6e4);
	if (!transcript) throw new Error("Nothing to summarise in this chat yet");
	const { data: settings } = await context.supabase.from("openrouter_settings").select("api_key, mistral_api_key, groq_api_key, nvidia_api_key, model").maybeSingle();
	if (!settings) throw new Error("Add an AI provider key on the Account tab first");
	const modelId = thread.model || settings.model;
	const route = modelId.startsWith("mistral:") ? {
		base: "https://api.mistral.ai/v1",
		key: settings.mistral_api_key,
		prefix: "mistral:"
	} : modelId.startsWith("groq:") ? {
		base: "https://api.groq.com/openai/v1",
		key: settings.groq_api_key,
		prefix: "groq:"
	} : modelId.startsWith("nvidia:") ? {
		base: "https://integrate.api.nvidia.com/v1",
		key: settings.nvidia_api_key,
		prefix: "nvidia:"
	} : {
		base: "https://openrouter.ai/api/v1",
		key: settings.api_key,
		prefix: ""
	};
	if (!route.key) throw new Error("Add the API key for this chat's model first");
	const res = await fetch(`${route.base}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${route.key}`
		},
		body: JSON.stringify({
			model: modelId.slice(route.prefix.length),
			messages: [{
				role: "system",
				content: "Summarise this coding conversation so another AI agent can continue the work with full understanding. Capture: the overall goal, key decisions and constraints, what has been implemented so far, what is still pending, and anything that failed or must be avoided. Be dense and concrete. No preamble, no code blocks."
			}, {
				role: "user",
				content: transcript
			}]
		})
	});
	if (!res.ok) throw new Error(`Summary failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
	const summary = (await res.json()).choices?.[0]?.message?.content?.trim();
	if (!summary) throw new Error("The model returned an empty summary");
	const combined = thread.seed_summary ? `${thread.seed_summary}\n\n---\n\n${summary}` : summary;
	const { data: row, error } = await context.supabase.from("chat_threads").insert({
		user_id: context.userId,
		repo_selection_id: thread.repo_selection_id,
		title: `Branch of ${thread.title}`.slice(0, 120),
		model: thread.model,
		mode: thread.mode,
		seed_summary: combined
	}).select("id").single();
	if (error) throw error;
	return {
		threadId: row.id,
		summary
	};
});
var getThreadSeed_createServerFn_handler = createServerRpc({
	id: "b38d2d9290280abca8fcca1eb47b72c55ab03ff4bc85c0955e05018d97676861",
	name: "getThreadSeed",
	filename: "src/lib/agent.functions.ts"
}, (opts) => getThreadSeed.__executeServer(opts));
var getThreadSeed = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(getThreadSeed_createServerFn_handler, async ({ context, data }) => {
	const { data: row } = await context.supabase.from("chat_threads").select("seed_summary, mode").eq("id", data.id).maybeSingle();
	return row;
});
//#endregion
export { branchThread_createServerFn_handler, getLatestTask_createServerFn_handler, getStagedChanges_createServerFn_handler, getThreadSeed_createServerFn_handler, listAgentEvents_createServerFn_handler, setThreadMode_createServerFn_handler };
