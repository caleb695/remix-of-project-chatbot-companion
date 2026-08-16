globalThis.__nitro_main__ = import.meta.url;
import { n as HTTPError, r as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { t as HookableCore } from "./_libs/hookable.mjs";
import { r as FastResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
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
		"mtime": "2026-08-16T22:56:53.690Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/assets/Combination-BeYfMBAT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7d1a-NCYTuLlCdlScg0chdYetu9ZEYpI\"",
		"mtime": "2026-08-16T22:56:49.702Z",
		"size": 32026,
		"path": "../public/assets/Combination-BeYfMBAT.js"
	},
	"/assets/account-BQMT7U2n.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12b29-IiQm4nA/fqSmt6S/X9TTyo4Y/Zg\"",
		"mtime": "2026-08-16T22:56:49.702Z",
		"size": 76585,
		"path": "../public/assets/account-BQMT7U2n.js"
	},
	"/assets/account-Doj9ZBeD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17f-IS0ODguNKs2t416Qd0e/H95dlSg\"",
		"mtime": "2026-08-16T22:56:49.702Z",
		"size": 383,
		"path": "../public/assets/account-Doj9ZBeD.js"
	},
	"/assets/auth-DqVH7WiS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1c05-/lvK6kGr1Emoxq3VIQ5iCafEyvk\"",
		"mtime": "2026-08-16T22:56:49.702Z",
		"size": 7173,
		"path": "../public/assets/auth-DqVH7WiS.js"
	},
	"/assets/button-DFlhF8fw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7cdc-/RiVGo4NN4+wCE4ok5OEYa8BDXw\"",
		"mtime": "2026-08-16T22:56:49.702Z",
		"size": 31964,
		"path": "../public/assets/button-DFlhF8fw.js"
	},
	"/assets/chat-eL7h-bD6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8d-ZKOIOaWYF/mrFAZ0KKA+zVDRTs4\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 141,
		"path": "../public/assets/chat-eL7h-bD6.js"
	},
	"/assets/chat._threadId-fLrV-DL9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2de11-heL5RRN3fKZeWCQd6Q7k95j5QjU\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 187921,
		"path": "../public/assets/chat._threadId-fLrV-DL9.js"
	},
	"/assets/chat.index-CEvNIK9I.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a39-hoyeUaJMUDCEUwgwYYTcbAuY5Go\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 2617,
		"path": "../public/assets/chat.index-CEvNIK9I.js"
	},
	"/assets/createLucideIcon-CEGepnBf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4ab-9w7034WUPiHI10TPGK6P975saJ0\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 1195,
		"path": "../public/assets/createLucideIcon-CEGepnBf.js"
	},
	"/assets/dist-CXy0r4Gr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4b3-6yMLZftp2vNtoSRN52LytHnbzOE\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 1203,
		"path": "../public/assets/dist-CXy0r4Gr.js"
	},
	"/assets/github-YsBbTulb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"197-rjdS1a6Ipe9VCLcf2FBoDNn86Gg\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 407,
		"path": "../public/assets/github-YsBbTulb.js"
	},
	"/assets/invariant-DEEwAagU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3c-eVh/3DMi1s3cxf4N/OJar+ew1jA\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 60,
		"path": "../public/assets/invariant-DEEwAagU.js"
	},
	"/assets/jsx-runtime-Cltr0gcK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20ee-ObwGPj96dlkL76iVLbX2wLAXzuw\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 8430,
		"path": "../public/assets/jsx-runtime-Cltr0gcK.js"
	},
	"/assets/kaggle.functions-B0T1er8u.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4932-Rz6aBrv/lV58FYVhArnT6gAE2IQ\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 18738,
		"path": "../public/assets/kaggle.functions-B0T1er8u.js"
	},
	"/assets/label-C5lJOdnP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2ae-KI72wC0waoWF1wrNvlDokrRBA2I\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 686,
		"path": "../public/assets/label-C5lJOdnP.js"
	},
	"/assets/matchContext-BIvqOYEx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8e-2nyeYZ+nByZ79uBpTc08wyFrxjE\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 142,
		"path": "../public/assets/matchContext-BIvqOYEx.js"
	},
	"/assets/route-BeOaygDL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"639-E7DDgJoM7KYEXc7NQq3ruzVFBe0\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 1593,
		"path": "../public/assets/route-BeOaygDL.js"
	},
	"/assets/routes-KYZeFLED.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e21-bOKlwYJeCtUGhNzbywXB41pTyyo\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 3617,
		"path": "../public/assets/routes-KYZeFLED.js"
	},
	"/assets/sparkles-C-wfMPnb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ee-xdKjJ3+/+dRDz1GpNZV6deESOBM\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 494,
		"path": "../public/assets/sparkles-C-wfMPnb.js"
	},
	"/assets/styles-Bj8ShAz-.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"13617-4p6EwFX6TpnEIONF0zeZh2CkJOI\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 79383,
		"path": "../public/assets/styles-Bj8ShAz-.css"
	},
	"/assets/threads.functions-DL1rsYet.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3c3-0/+ETBNRv9zw9qxNQJSS7SfbcdY\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 963,
		"path": "../public/assets/threads.functions-DL1rsYet.js"
	},
	"/assets/use-keyboard-inset-BXn3PM4z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a4-rn2C5eV7Pr9hkwgwEuMHMJU1o6Q\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 676,
		"path": "../public/assets/use-keyboard-inset-BXn3PM4z.js"
	},
	"/assets/useRouter-CwjitLz4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"97-RAU16egCj2YoU17v/JNQx0lTbng\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 151,
		"path": "../public/assets/useRouter-CwjitLz4.js"
	},
	"/assets/index-D9Zes7BM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8d3d1-6yVpEeoDWDOyFRQwQNFB/wOr+Zg\"",
		"mtime": "2026-08-16T22:56:49.702Z",
		"size": 578513,
		"path": "../public/assets/index-D9Zes7BM.js"
	},
	"/assets/useStore-MrRycYaJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"761-tAhf8+n0s8Ovp9oECjua0Aky9+Q\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 1889,
		"path": "../public/assets/useStore-MrRycYaJ.js"
	},
	"/assets/utils-BILtoX7V.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cad-Kenb+C6Rj1fctKIlGu2IfrGxB6c\"",
		"mtime": "2026-08-16T22:56:49.703Z",
		"size": 3245,
		"path": "../public/assets/utils-BILtoX7V.js"
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
