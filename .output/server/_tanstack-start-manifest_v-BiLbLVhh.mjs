//#region node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-BiLbLVhh.js
var tsrStartManifest = () => ({ routes: {
	__root__: {
		filePath: "/workspace/src/routes/__root.tsx",
		children: [
			"/",
			"/_authenticated",
			"/auth",
			"/api/chat",
			"/api/github/callback",
			"/api/public/jobs/checkpoint",
			"/api/public/jobs/claim",
			"/api/public/jobs/complete",
			"/api/public/jobs/continue",
			"/api/public/jobs/event",
			"/api/public/jobs/index-batch",
			"/api/public/jobs/index-progress",
			"/api/public/jobs/log",
			"/api/public/jobs/new-messages",
			"/api/public/jobs/reference"
		],
		preloads: [
			"/assets/index-tA1TMVm7.js",
			"/assets/jsx-runtime-bzQ4Vb5N.js",
			"/assets/useStore-DF3kWqCr.js",
			"/assets/invariant-DEEwAagU.js",
			"/assets/useRouter-Cjk_0i46.js",
			"/assets/matchContext-CeRjqyBa.js"
		],
		scripts: [{ attrs: {
			type: "module",
			async: !0,
			src: "/assets/index-tA1TMVm7.js"
		} }]
	},
	"/": {
		filePath: "/workspace/src/routes/index.tsx",
		children: void 0,
		preloads: [
			"/assets/routes-BxcHWzry.js",
			"/assets/createLucideIcon-DeQrcgrh.js",
			"/assets/github-ChGckZ47.js",
			"/assets/sparkles-b6Z3h6qd.js",
			"/assets/button-BJvcJF_n.js"
		]
	},
	"/_authenticated": {
		filePath: "/workspace/src/routes/_authenticated/route.tsx",
		children: ["/_authenticated/account", "/_authenticated/chat"],
		preloads: [
			"/assets/route-seQPg70X.js",
			"/assets/createLucideIcon-DeQrcgrh.js",
			"/assets/use-keyboard-inset-B-_Va303.js"
		]
	},
	"/auth": {
		filePath: "/workspace/src/routes/auth.tsx",
		children: void 0,
		preloads: [
			"/assets/auth-6o-h4l7J.js",
			"/assets/sparkles-b6Z3h6qd.js",
			"/assets/button-BJvcJF_n.js",
			"/assets/dist-CUXdSn-D.js",
			"/assets/label-oqfodaQy.js"
		]
	},
	"/_authenticated/account": {
		filePath: "/workspace/src/routes/_authenticated/account.tsx",
		children: void 0,
		preloads: [
			"/assets/account-CzfDldgv.js",
			"/assets/button-BJvcJF_n.js",
			"/assets/account-TkRGsC1t.js",
			"/assets/kaggle.functions-YwtQgliA.js",
			"/assets/Combination-Bn-bDfYx.js",
			"/assets/github-ChGckZ47.js",
			"/assets/dist-CUXdSn-D.js",
			"/assets/label-oqfodaQy.js"
		]
	},
	"/_authenticated/chat": {
		filePath: "/workspace/src/routes/_authenticated/chat.tsx",
		children: ["/_authenticated/chat/$threadId", "/_authenticated/chat/"],
		preloads: ["/assets/chat-CtzB52xR.js"]
	},
	"/_authenticated/chat/$threadId": {
		filePath: "/workspace/src/routes/_authenticated/chat.$threadId.tsx",
		children: void 0,
		preloads: [
			"/assets/chat._threadId-Bop1fe3J.js",
			"/assets/kaggle.functions-YwtQgliA.js",
			"/assets/Combination-Bn-bDfYx.js",
			"/assets/github-ChGckZ47.js",
			"/assets/sparkles-b6Z3h6qd.js",
			"/assets/button-BJvcJF_n.js",
			"/assets/dist-CUXdSn-D.js",
			"/assets/threads.functions-DsV3D9bV.js"
		]
	},
	"/_authenticated/chat/": {
		filePath: "/workspace/src/routes/_authenticated/chat.index.tsx",
		children: void 0,
		preloads: [
			"/assets/chat.index-B3pfh1j3.js",
			"/assets/kaggle.functions-YwtQgliA.js",
			"/assets/github-ChGckZ47.js",
			"/assets/button-BJvcJF_n.js",
			"/assets/threads.functions-DsV3D9bV.js"
		]
	}
} });
//#endregion
export { tsrStartManifest };
