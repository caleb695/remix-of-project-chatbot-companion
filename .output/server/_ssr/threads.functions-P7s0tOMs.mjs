import { c as createServerFn } from "./createServerFn-BFFE07zL.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-UH_Jp6hR.mjs";
import { Ft as stringType, Pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { i as createSsrRpc } from "./kaggle.functions-Dk7H3ttr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/threads.functions-P7s0tOMs.js
var listThreads = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("ebbbc99857ac917fa22c2b1d438323ae8fd03205b61e4f2e84e349f57ca98c3c"));
var createThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	repoId: stringType().uuid().optional(),
	kaggleNotebookId: stringType().uuid().optional(),
	model: stringType().optional()
}).refine((v) => Boolean(v.repoId) !== Boolean(v.kaggleNotebookId), { message: "Pick either a repo or a Kaggle notebook" }).parse(input)).handler(createSsrRpc("67dca520864171111cdf48efef1043d4a0da2d685a1c0b4280bd5013be4b79c9"));
var deleteThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("568557aff3b98c509b2e18e3b33bc94e0f42eaf3bf5efa80b0f9c8e64ed87602"));
var getThreadMessages = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ threadId: stringType().uuid() }).parse(input)).handler(createSsrRpc("4de48302a58b8017a3864af8f5d4bfff1891bb7bbd691f1f10fb1c616272eab8"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	title: stringType().min(1).max(200)
}).parse(input)).handler(createSsrRpc("56b694316d1e17dc10b8d6d407eefbb0620bf9f9d0f5024d355b930910c4496c"));
var getThread = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("d3b5c99710bd28fef85ba35dd8e9416271f29ded53625108faccb3089c6e0da5"));
var updateThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	model: stringType().optional(),
	repo_selection_id: stringType().uuid().optional(),
	kaggle_notebook_id: stringType().uuid().optional()
}).parse(input)).handler(createSsrRpc("e2cbd8565bebfb0e0cfaed95334191009cced99011fd393abbc97ae678ff4cee"));
//#endregion
export { listThreads as a, getThreadMessages as i, deleteThread as n, updateThread as o, getThread as r, createThread as t };
