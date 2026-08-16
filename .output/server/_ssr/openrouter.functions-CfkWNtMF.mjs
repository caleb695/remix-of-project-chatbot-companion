import { c as createServerFn } from "./createServerFn-BFFE07zL.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-UH_Jp6hR.mjs";
import { Ft as stringType, Mt as enumType, Pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { i as createSsrRpc } from "./kaggle.functions-B_7yxI00.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/openrouter.functions-CfkWNtMF.js
/** Write a file into the user's repo through the Contents API. */
/**
* Repos keep their own copy of the runner, so a runner fix only reaches them
* when the files are rewritten. Compare the version stamped in the installed
* workflow and refresh both files when it is behind.
*/
var installCoderWorkflow = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ repoId: stringType().uuid() }).parse(i)).handler(createSsrRpc("383c2b9874e19cea47ee663539bd20129142921efe99c79ed3fd099b06632900"));
var enqueueCodingJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((i) => objectType({
	threadId: stringType().uuid(),
	prompt: stringType().min(1).max(2e4),
	mode: enumType([
		"plan",
		"build",
		"debug",
		"improve"
	]).optional(),
	taskId: stringType().optional()
}).parse(i)).handler(createSsrRpc("b58c2ec13ae92fdd06b49b3664dd704be7eaac97e3d36288ae0a1524cae6596e"));
var getJob = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(createSsrRpc("432b934c493a65b20930541aa425464f2c52d0a8716794775211fc250ec5a8e5"));
/** The full patch the run produced, for the review screen. */
var getJobDiff = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(createSsrRpc("ff56f97c1602fd8f21d00892d160b37595d659ba851a485a5c9265ce78de51cb"));
/** Merge the run's review branch into the working branch — the user's approval. */
var approveJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(createSsrRpc("1a3b9034e7640601f7d2fd280fa3f78f56ec077718405469a799410b4a1f2d8a"));
/** Throw the run's changes away without touching the working branch. */
var discardJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(createSsrRpc("84414820f38145d46d0817d5ecdd9567dfcef88237251d9b3498becd3535eefb"));
var listJobsForThread = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ threadId: stringType().uuid() }).parse(i)).handler(createSsrRpc("ae88e471ba0555f9a707a0c7ca719d83edb88cc0e440cc622590141b52c8d806"));
var cancelJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(createSsrRpc("9e68af82cd2a1c15199838803e19d0ecc2492b63dfb855608f5f90105b675297"));
var enqueueIndexJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((i) => objectType({
	repoId: stringType().uuid(),
	model: stringType().min(1).max(200)
}).parse(i)).handler(createSsrRpc("dd67ab5bee4120ce2012572bc63c6585809acd1e78477f376662c6e59638ecc9"));
var getLatestIndexJob = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ repoId: stringType().uuid() }).parse(i)).handler(createSsrRpc("cb2d0481864d2f68e1c998e8688fc35ed55f354828ad77387cad45d70248a1d1"));
var getOpenrouterSettings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("e5b7c8182034b830cbaf183fec33ff774adee4dc89d3b6fcd918d53ef88b0874"));
var saveOpenrouterSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({
	apiKey: stringType().min(10).max(500).optional(),
	mistralApiKey: stringType().min(10).max(500).optional(),
	groqApiKey: stringType().min(10).max(500).optional(),
	nvidiaApiKey: stringType().min(10).max(500).optional(),
	embeddingProvider: enumType([
		"mistral",
		"openrouter",
		"nvidia"
	]),
	embeddingModel: stringType().min(1).max(200),
	model: stringType().min(1).max(200)
}).parse(input)).handler(createSsrRpc("deeea28e1e77c1224b842a173c7a012c9ff69ef6512c469b6fdc5c0d8f5164ba"));
var listOpenrouterModels = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("6813e1f2449c5091b0f108bd46ec8e550784e9cd40b86b30c4a02021a84b6de5"));
//#endregion
export { enqueueIndexJob as a, getLatestIndexJob as c, listJobsForThread as d, listOpenrouterModels as f, enqueueCodingJob as i, getOpenrouterSettings as l, cancelJob as n, getJob as o, saveOpenrouterSettings as p, discardJob as r, getJobDiff as s, approveJob as t, installCoderWorkflow as u };
