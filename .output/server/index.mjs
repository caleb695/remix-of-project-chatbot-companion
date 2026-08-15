globalThis.__nitro_main__ = import.meta.url;
import { a as FastResponse, n as HTTPError, r as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { t as HookableCore } from "./_libs/hookable.mjs";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-08-15T15:34:29.047Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/assets/Combination-Dl8xEHyX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6f55-8yP+jjcHOxKCsSPQgGqCiMj1TLI\"",
		"mtime": "2026-08-15T15:34:25.056Z",
		"size": 28501,
		"path": "../public/assets/Combination-Dl8xEHyX.js"
	},
	"/assets/account-CohC9beJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"116e4-ZFJgKRcEz95azxdyASRcLSQ0MRM\"",
		"mtime": "2026-08-15T15:34:25.056Z",
		"size": 71396,
		"path": "../public/assets/account-CohC9beJ.js"
	},
	"/assets/account-CzfDldgv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17f-2tJkVlNurnONKMxS5p0Wy3knvKY\"",
		"mtime": "2026-08-15T15:34:25.056Z",
		"size": 383,
		"path": "../public/assets/account-CzfDldgv.js"
	},
	"/assets/auth-DjcIAv1M.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1c05-SQm3ku8A7ZLNFcZnY35OIm4Vrr4\"",
		"mtime": "2026-08-15T15:34:25.056Z",
		"size": 7173,
		"path": "../public/assets/auth-DjcIAv1M.js"
	},
	"/assets/button-BJvcJF_n.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a9a-gqDtNv1VZvBULMudu3YN6xrn2gc\"",
		"mtime": "2026-08-15T15:34:25.056Z",
		"size": 31386,
		"path": "../public/assets/button-BJvcJF_n.js"
	},
	"/assets/chat-B0DHFjxk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8d-SGTponDRJAcIF6WhW27HM+05cNw\"",
		"mtime": "2026-08-15T15:34:25.056Z",
		"size": 141,
		"path": "../public/assets/chat-B0DHFjxk.js"
	},
	"/assets/chat._threadId-sottfMrR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3a786-QzkrzID2VzY/KaFpunMElXtZzew\"",
		"mtime": "2026-08-15T15:34:25.056Z",
		"size": 239494,
		"path": "../public/assets/chat._threadId-sottfMrR.js"
	},
	"/assets/chat.index-ClEIq4Qf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a39-mNvN3rolKxmEzQ1dsC3CCSkKzdQ\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 2617,
		"path": "../public/assets/chat.index-ClEIq4Qf.js"
	},
	"/assets/createLucideIcon-DeQrcgrh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4ab-cR1PODv03KUfJz4HloEEypYngbs\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 1195,
		"path": "../public/assets/createLucideIcon-DeQrcgrh.js"
	},
	"/assets/dist-BKSjPl9B.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"449-Dy+VRMEO3ZG3xIdUZ4NJ3JSUNsw\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 1097,
		"path": "../public/assets/dist-BKSjPl9B.js"
	},
	"/assets/github-ChGckZ47.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"197-QS9pj8mHS7lVhWdmWpb23SeSn/A\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 407,
		"path": "../public/assets/github-ChGckZ47.js"
	},
	"/assets/invariant-DEEwAagU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3c-eVh/3DMi1s3cxf4N/OJar+ew1jA\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 60,
		"path": "../public/assets/invariant-DEEwAagU.js"
	},
	"/assets/jsx-runtime-bzQ4Vb5N.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20d8-vMfP+4a4ykIjbw4InHkj3E5HWt0\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 8408,
		"path": "../public/assets/jsx-runtime-bzQ4Vb5N.js"
	},
	"/assets/kaggle.functions-xgbF80zH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4937-FEtQAyZrP1AFt8xCysHy+T+ixJ0\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 18743,
		"path": "../public/assets/kaggle.functions-xgbF80zH.js"
	},
	"/assets/label-DnPD3elL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"272-ALEfsvToODXi6/knz2rheAgVuyU\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 626,
		"path": "../public/assets/label-DnPD3elL.js"
	},
	"/assets/matchContext-CeRjqyBa.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8e-/YbnImNo/o5hX8ZkgU+LNn1RdzY\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 142,
		"path": "../public/assets/matchContext-CeRjqyBa.js"
	},
	"/assets/route-JVvgyBx9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"639-NLgwti0kXqp7siovFZkTsMiCKGE\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 1593,
		"path": "../public/assets/route-JVvgyBx9.js"
	},
	"/assets/routes-Bp9-hsBp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e21-2CMOtst/Lj0b8HKnHkRaoVuTtV8\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 3617,
		"path": "../public/assets/routes-Bp9-hsBp.js"
	},
	"/assets/sparkles-b6Z3h6qd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ee-eVqKo/8GdittPrhby3lwUdNeRxs\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 494,
		"path": "../public/assets/sparkles-b6Z3h6qd.js"
	},
	"/assets/styles-TdUbLvGN.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"12f9a-R4uyrTTECnIi3+YHfm7QkJpDzT8\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 77722,
		"path": "../public/assets/styles-TdUbLvGN.css"
	},
	"/assets/threads.functions-D_BOIS3x.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3c3-oKxs0nDygWZO5QtTmA9hBX8M0w0\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 963,
		"path": "../public/assets/threads.functions-D_BOIS3x.js"
	},
	"/assets/use-keyboard-inset-B-_Va303.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a4-pvBjKv5vJajg7Ap0oo52D3D+q9o\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 676,
		"path": "../public/assets/use-keyboard-inset-B-_Va303.js"
	},
	"/assets/useRouter-Cjk_0i46.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"97-gJK3oOHMBg6w7z3BqmB1RWGawXE\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 151,
		"path": "../public/assets/useRouter-Cjk_0i46.js"
	},
	"/assets/index-BVvSyK-F.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8c938-cZnR/8b+kbfxfocLFrayxIrZJwk\"",
		"mtime": "2026-08-15T15:34:25.056Z",
		"size": 575800,
		"path": "../public/assets/index-BVvSyK-F.js"
	},
	"/assets/useStore-DF3kWqCr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"152c-v/UkG03GySu1e9s8fTMnS6jLmI8\"",
		"mtime": "2026-08-15T15:34:25.057Z",
		"size": 5420,
		"path": "../public/assets/useStore-DF3kWqCr.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_IO091Z = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_IO091Z
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
[].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function useNitroHooks() {
	const nitroApp = useNitroApp();
	const hooks = nitroApp.hooks;
	if (hooks) return hooks;
	return nitroApp.hooks = new HookableCore();
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/_module-handler.mjs
function createHandler(hooks) {
	const nitroApp = useNitroApp();
	const nitroHooks = useNitroHooks();
	return {
		async fetch(request, env, context) {
			globalThis.__env__ = env;
			augmentReq(request, {
				env,
				context
			});
			const ctxExt = {};
			const url = new URL(request.url);
			if (hooks.fetch) {
				const res = await hooks.fetch(request, env, context, url, ctxExt);
				if (res) return res;
			}
			return await nitroApp.fetch(request);
		},
		scheduled(controller, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:scheduled", {
				controller,
				env,
				context
			}) || Promise.resolve());
		},
		email(message, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:email", {
				message,
				event: message,
				env,
				context
			}) || Promise.resolve());
		},
		queue(batch, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:queue", {
				batch,
				event: batch,
				env,
				context
			}) || Promise.resolve());
		},
		tail(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:tail", {
				traces,
				env,
				context
			}) || Promise.resolve());
		},
		trace(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:trace", {
				traces,
				env,
				context
			}) || Promise.resolve());
		}
	};
}
function augmentReq(cfReq, ctx) {
	const req = cfReq;
	req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
	req.runtime ??= { name: "cloudflare" };
	req.runtime.cloudflare = {
		...req.runtime.cloudflare,
		...ctx
	};
	req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/cloudflare-module.mjs
var cloudflare_module_default = createHandler({ fetch(cfRequest, env, context, url) {
	if (env.ASSETS && isPublicAssetURL(url.pathname)) return env.ASSETS.fetch(cfRequest);
} });
//#endregion
export { cloudflare_module_default as default };
