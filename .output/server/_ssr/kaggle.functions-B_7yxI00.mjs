import { i as __toESM } from "../_runtime.mjs";
import { c as require_react } from "../_libs/@ai-sdk/react+[...].mjs";
import { k as isRedirect, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as createServerFn, i as TSS_SERVER_FUNCTION } from "./createServerFn-BFFE07zL.mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-VJuV73ZC.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-UH_Jp6hR.mjs";
import { Ft as stringType, Nt as numberType, Pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/kaggle.functions-B_7yxI00.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var startGithubOAuth = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("97110434a438c49cd499e3c70a52a036435a2b85749b0e8361f876324203dfd0"));
var getGithubConnection = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("f8a5ee7e0516d76c89994a5a0ca79a2c69121197830b39ab46a1733b63d98e69"));
var disconnectGithub = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("263f8c6eb13c8d3d8a803f3c828a8d917c503f678c57393732b8761dcb9e4aea"));
var listUserRepos = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("5865ecbb18260a33286678ab6e0d140bdd55f92f5a13a78396f5525e53aadf83"));
var addRepoSelection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({
	github_repo_id: numberType(),
	owner: stringType(),
	name: stringType(),
	default_branch: stringType()
}).parse(input)).handler(createSsrRpc("e8a78c2dbc421c44f3e114c7646a04afc3834e1523aca5e4d5dbcfeaec3968da"));
var listRepoSelections = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("0f99a1504db237cd1d0bdf49ddb56d47b84997c156e56ec386bc71971f0590b9"));
createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("efa440b4311e373bbe3f4bb8a8f7d9e763f339a8e716a7937d7ab2c1a2cb7c32"));
var removeRepoSelection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("5c46a8c7f4107f0d11228ba99265b67c97b569009ab856968686e41bc4483633"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({ repoId: stringType().uuid() }).parse(input)).handler(createSsrRpc("a0196570d479357d50e8b01c9cad32872c32f205b29dd876fabf47ca17239a31"));
var commitAndPush = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({
	repoId: stringType().uuid(),
	message: stringType().min(1).max(500)
}).parse(input)).handler(createSsrRpc("6d52b6b8ecf415ee128139843febbaaa574fdebea4a56d5196d37d2f57371819"));
createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator((input) => objectType({ repoId: stringType().uuid() }).parse(input)).handler(createSsrRpc("e112093d4fe65c6dcb569054830b78ff48691e7b06ef4607f563fcd0ba9412ea"));
createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator((input) => objectType({
	repoId: stringType().uuid(),
	path: stringType()
}).parse(input)).handler(createSsrRpc("536f9c9c915f5101a66e533d2b37f11b778483e860b85afe7d0f8d003c30381b"));
var saveKaggleCreds = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((i) => objectType({
	username: stringType().min(1).max(100),
	key: stringType().min(10).max(500)
}).parse(i)).handler(createSsrRpc("6a09f1011311f2b9139bcfafe0f559db536e19fa17ff1a685298ea83bc0abdab"));
var getKaggleStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("23a2c4823e8bb13a83d09966071f1ed32a75f8501093e42fbd76e8c7a6be9a69"));
var listKaggleKernels = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("96549b6855bb582d1a90a1ff053afc2250c8b7f7128fa9895587728ed81f909d"));
var listKaggleNotebooks = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("a21d84617f145c61051a35857832152a9e55478387715f7973efb8d57cd91fbf"));
var addKaggleNotebook = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ ref: stringType().min(3).max(200) }).parse(i)).handler(createSsrRpc("b832d657aad7abc4d28fa766d262862dbc028c774a000ecd53bd6e65673d9aff"));
var removeKaggleNotebook = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(createSsrRpc("31731067b94acfbcbf32bc1df0f96c20df6da7e9bd13f83cca0019a5c48eadff"));
/** Re-pull from Kaggle, discarding staged edits. */
var syncKaggleNotebook = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(createSsrRpc("760b9e27f6a7737e5c912b41d99e75b01a2679c82764c912ff66a7ed870314ca"));
var getKaggleStaged = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(createSsrRpc("c7061e41b1a568ea9a2449b8be28780c46c956a193b0f234fc7c3c8319a8e5fb"));
/** Push the staged notebook source back to Kaggle (a new version). */
var pushKaggleNotebook = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(createSsrRpc("b92dee861c9f13b4c7dec5cb60312a1dfc581c74745b6f497aa62a9c161120db"));
//#endregion
export { startGithubOAuth as _, disconnectGithub as a, getKaggleStatus as c, listRepoSelections as d, listUserRepos as f, saveKaggleCreds as g, removeRepoSelection as h, createSsrRpc as i, listKaggleKernels as l, removeKaggleNotebook as m, addRepoSelection as n, getGithubConnection as o, pushKaggleNotebook as p, commitAndPush as r, getKaggleStaged as s, addKaggleNotebook as t, listKaggleNotebooks as u, syncKaggleNotebook as v, useServerFn as y };
