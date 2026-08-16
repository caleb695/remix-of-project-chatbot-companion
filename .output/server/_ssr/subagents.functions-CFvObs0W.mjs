import { c as createServerFn } from "./createServerFn-BFFE07zL.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-UH_Jp6hR.mjs";
import { At as arrayType, Ft as stringType, Pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { t as createServerRpc } from "./createServerRpc-MBa5GZ-L.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/subagents.functions-CFvObs0W.js
var subAgentSchema = objectType({
	id: stringType().min(1).max(40),
	label: stringType().min(1).max(60),
	model: stringType().min(1).max(200),
	instructions: stringType().max(2e3).optional()
});
var getSubAgents_createServerFn_handler = createServerRpc({
	id: "cc134a8451f0397fce9275c29f3e295ea3f90b68b1b1606ec0c3bd93fe4d1297",
	name: "getSubAgents",
	filename: "src/lib/subagents.functions.ts"
}, (opts) => getSubAgents.__executeServer(opts));
var getSubAgents = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ threadId: stringType().uuid() }).parse(i)).handler(getSubAgents_createServerFn_handler, async ({ context, data }) => {
	const { data: row } = await context.supabase.from("chat_threads").select("sub_agents").eq("id", data.threadId).maybeSingle();
	return Array.isArray(row?.sub_agents) ? row.sub_agents : [];
});
var setSubAgents_createServerFn_handler = createServerRpc({
	id: "59c25b85be7f4346a759731421f4296670280620b664549f3205fd33d068993b",
	name: "setSubAgents",
	filename: "src/lib/subagents.functions.ts"
}, (opts) => setSubAgents.__executeServer(opts));
var setSubAgents = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((i) => objectType({
	threadId: stringType().uuid(),
	subAgents: arrayType(subAgentSchema).max(20)
}).parse(i)).handler(setSubAgents_createServerFn_handler, async ({ context, data }) => {
	const { error } = await context.supabase.from("chat_threads").update({ sub_agents: data.subAgents }).eq("id", data.threadId);
	if (error) throw error;
	return { ok: true };
});
//#endregion
export { getSubAgents_createServerFn_handler, setSubAgents_createServerFn_handler };
