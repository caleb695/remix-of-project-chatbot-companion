import { i as __toESM } from "../_runtime.mjs";
import { a as isStepCount, c as require_react, i as convertToModelMessages, o as streamText, s as require_jsx_runtime } from "../_libs/@ai-sdk/react+[...].mjs";
import { M as redirect, c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, m as createFileRoute, p as lazyRouteComponent, s as Scripts, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { t as supabase } from "./client--F9kIJS3.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { t as ghFetch } from "./github.server-liDhNs7u.mjs";
import { t as createOpenAICompatible } from "../_libs/ai-sdk__openai-compatible.mjs";
import processModule from "node:process";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BE7aZblc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-Fgj32DSn.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$19 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Coderbot — AI pair programmer for your GitHub repos" },
			{
				name: "description",
				content: "Chat with an AI that reads and edits your GitHub project. Review its changes, then commit when you're ready."
			},
			{
				property: "og:title",
				content: "Coderbot — AI pair programmer for your GitHub repos"
			},
			{
				property: "og:description",
				content: "Chat with an AI that reads and edits your GitHub project. Review its changes, then commit when you're ready."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "theme-color",
				content: "#0f1520"
			},
			{
				name: "twitter:title",
				content: "Coderbot — AI pair programmer for your GitHub repos"
			},
			{
				name: "twitter:description",
				content: "Chat with an AI that reads and edits your GitHub project. Review its changes, then commit when you're ready."
			},
			{
				property: "og:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cd61d784-a2e5-47ca-9bc5-8bd2b0c2f1cf/id-preview-743e00a9--ac8a5fbd-bc5a-4c90-b9b5-18431f892993.lovable.app-1783633351756.png"
			},
			{
				name: "twitter:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cd61d784-a2e5-47ca-9bc5-8bd2b0c2f1cf/id-preview-743e00a9--ac8a5fbd-bc5a-4c90-b9b5-18431f892993.lovable.app-1783633351756.png"
			}
		],
		links: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$19.useRouteContext();
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		const { data: sub } = supabase.auth.onAuthStateChange((event) => {
			if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
			router.invalidate();
			if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
		});
		return () => sub.subscription.unsubscribe();
	}, [router, queryClient]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {})]
	});
}
var $$splitComponentImporter$6 = () => import("./auth-C1UoDvBQ.mjs");
var Route$18 = createFileRoute("/auth")({
	ssr: false,
	head: () => ({ meta: [
		{ title: "Sign in — Coderbot" },
		{
			name: "description",
			content: "Sign in to Coderbot to connect your GitHub repos and start coding with an AI agent."
		},
		{
			property: "og:title",
			content: "Sign in — Coderbot"
		},
		{
			property: "og:description",
			content: "Sign in to Coderbot to connect your GitHub repos and start coding with an AI agent."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./route-Db3-ertr.mjs");
var Route$17 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async () => {
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user) throw redirect({ to: "/auth" });
		return { user: data.user };
	},
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./routes-CUH1aza-.mjs");
var Route$16 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Coderbot — an AI pair programmer for your GitHub repos" },
		{
			name: "description",
			content: "Connect a GitHub repo, pick a model, and chat. Coderbot reads and edits a working copy — nothing is pushed until you commit."
		},
		{
			property: "og:title",
			content: "Coderbot — an AI pair programmer for your GitHub repos"
		},
		{
			property: "og:description",
			content: "Connect a GitHub repo, pick a model, and chat. Coderbot reads and edits a working copy — nothing is pushed until you commit."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
function modePrompts(isKaggle) {
	const subject = isKaggle ? "the notebook source" : "the repository";
	const read = isKaggle ? "Read the notebook with read_notebook" : "Read the files you need";
	const writeTools = isKaggle ? "write_notebook/edit_notebook" : "write_file/edit_file/delete_file";
	const editing = `${read}, make focused edits with ${writeTools}, then call check_code. If check_code reports problems, fix them and call check_code again. Repeat until it is clean AND the task is actually complete. Only then write your final summary. You must actually call a write tool — a reply that only describes the change is a failed run.`;
	return {
		plan: `MODE: PLAN. You are brainstorming with the user. You may read and search ${subject}, but you must NOT change anything — you have no write tools in this mode. Ask the user clarifying questions about their code and intent, propose approaches, and end with a concrete step-by-step plan. Tell them to switch to Build mode when they want it implemented.`,
		build: `MODE: BUILD. Implement the user's request end to end. ${editing}`,
		debug: `MODE: DEBUG. Find and fix real bugs and problems that are likely to happen — not speculative low-probability ones. ${read}, search for the failure surface, fix it with ${writeTools}, then call check_code and repeat until clean. Explain each root cause you fixed.`,
		improve: `MODE: IMPROVE. Improve ${subject}: add sensible features, simplify and speed up existing code, remove duplication, and harden weak spots. Make real edits with ${writeTools}, then call check_code and repeat until clean. Do not restructure everything at once — make a coherent set of improvements and explain them.`
	};
}
var PHASE = {
	planning: "planning",
	coding: "coding",
	checking: "checking",
	debugging: "debugging",
	done: "done"
};
/**
* Interleave SSE comment lines (`: keepalive\n\n`) into a streaming Response
* body while the model is silent. Comments are ignored by SSE clients but keep
* the connection alive so a slow first token (reasoning models, large context)
* isn't dropped by the platform/proxy and surfaced to the browser as a raw
* "load failed". Stops as soon as the underlying stream closes.
*/
function withSseHeartbeat(response) {
	if (!response.body) return response;
	const HEARTBEAT_MS = 15e3;
	const KEEPALIVE = new TextEncoder().encode(": keepalive\n\n");
	const source = response.body;
	const out = new ReadableStream({
		start(controller) {
			const pump = async () => {
				const reader = source.getReader();
				const beat = () => {
					try {
						controller.enqueue(KEEPALIVE);
					} catch {}
				};
				const timer = setInterval(beat, HEARTBEAT_MS);
				try {
					for (;;) {
						const { done, value } = await reader.read();
						if (done) break;
						if (value) controller.enqueue(value);
					}
				} catch {} finally {
					if (timer) clearInterval(timer);
					try {
						controller.close();
					} catch {}
				}
			};
			pump();
		},
		cancel() {
			try {
				source.cancel();
			} catch {}
		}
	});
	return new Response(out, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
}
var Route$15 = createFileRoute("/api/chat")({ server: { handlers: { POST: async ({ request }) => {
	const auth = request.headers.get("authorization");
	if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
	const token = auth.slice(7);
	const { createClient } = await import("../_libs/supabase__supabase-js.mjs").then((n) => n.n);
	const supa = createClient(processModule.env.SUPABASE_URL, processModule.env.SUPABASE_PUBLISHABLE_KEY, {
		global: { headers: { Authorization: `Bearer ${token}` } },
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			storage: void 0
		}
	});
	const { data: userData, error: uerr } = await supa.auth.getUser(token);
	if (uerr || !userData.user) return new Response("Unauthorized", { status: 401 });
	const userId = userData.user.id;
	const body = await request.json();
	const { messages, threadId } = body;
	const taskId = body.taskId || crypto.randomUUID();
	if (!threadId) return new Response("Missing threadId", { status: 400 });
	const { data: thread } = await supa.from("chat_threads").select("id, title, model, mode, seed_summary, target, repo_selection_id, kaggle_notebook_id").eq("id", threadId).maybeSingle();
	if (!thread) return new Response("Thread not found", { status: 404 });
	const isKaggle = thread.target === "kaggle" && Boolean(thread.kaggle_notebook_id);
	const mode = body.mode ?? thread.mode ?? "build";
	const { data: settings } = await supa.from("openrouter_settings").select("api_key, model, mistral_api_key, groq_api_key, nvidia_api_key, embedding_provider, embedding_model").maybeSingle();
	if (!settings) return new Response("Add an AI provider key on the Account tab first.", { status: 400 });
	const modelId = thread.model || settings.model;
	const logEvent = async (kind, text, phase, agent = {
		id: "main",
		label: "Main agent"
	}) => {
		await supa.from("agent_events").insert({
			user_id: userId,
			thread_id: threadId,
			task_id: taskId,
			agent_id: agent.id,
			agent_label: agent.label,
			phase,
			kind,
			text: text.slice(0, 4e3)
		});
	};
	const lastUser = messages[messages.length - 1];
	const lastUserText = lastUser?.role === "user" ? lastUser.parts.map((p) => p.type === "text" ? p.text : "").join(" ").trim() : "";
	if (lastUser?.role === "user") {
		await supa.from("chat_messages").insert({
			thread_id: threadId,
			user_id: userId,
			role: "user",
			parts: lastUser.parts
		});
		if (thread.title === "New chat") {
			const text = lastUserText.slice(0, 60);
			if (text) await supa.from("chat_threads").update({ title: text }).eq("id", threadId);
		}
	}
	await logEvent("status", `Received task in ${mode} mode`, PHASE.planning);
	await logEvent("thought", "Working out what this task needs and which files matter. For long-running sessions, check if there are newer user messages to incorporate.", PHASE.planning);
	let kaggleJobId = null;
	if (isKaggle) {
		const { data: kj } = await supa.from("coding_jobs").insert({
			user_id: userId,
			thread_id: threadId,
			repo_selection_id: null,
			status: "running",
			prompt: lastUserText || "",
			model: modelId,
			job_type: "kaggle",
			mode,
			task_id: taskId,
			logs: ""
		}).select("id").single();
		kaggleJobId = kj?.id ?? null;
	}
	let ragContext = "";
	const embeddingKey = settings.embedding_provider === "mistral" ? settings.mistral_api_key : settings.embedding_provider === "nvidia" ? settings.nvidia_api_key : settings.api_key;
	const embeddingUrl = settings.embedding_provider === "mistral" ? "https://api.mistral.ai/v1/embeddings" : settings.embedding_provider === "nvidia" ? "https://integrate.api.nvidia.com/v1/embeddings" : "https://openrouter.ai/api/v1/embeddings";
	if (!isKaggle && thread.repo_selection_id && embeddingKey && lastUserText) {
		try {
			const embRes = await fetch(embeddingUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${embeddingKey}`
				},
				body: JSON.stringify({
					model: settings.embedding_model,
					input: [lastUserText.slice(0, 4e3)]
				})
			});
			if (embRes.ok) {
				const vec = (await embRes.json()).data[0]?.embedding;
				if (vec) {
					const { data: hits } = await supa.rpc("match_repo_chunks", {
						p_repo_selection_id: thread.repo_selection_id,
						p_query: vec,
						p_match_count: 8
					});
					if (hits?.length) ragContext = "Relevant repo code (semantic search):\n\n" + hits.map((h) => `--- ${h.path} ---\n${(h.content ?? "").slice(0, 1200)}`).join("\n\n");
				}
			}
		} catch {}
		const { data: files } = await supa.from("repo_files").select("path, summary").eq("repo_selection_id", thread.repo_selection_id).limit(400);
		if (files?.length) ragContext = `Repository file outline:\n${files.map((f) => f.summary ? `${f.path} — ${f.summary}` : f.path).join("\n").slice(0, 8e3)}\n\n${ragContext}`;
	}
	const route = modelId.startsWith("mistral:") ? {
		name: "mistral",
		prefix: "mistral:",
		baseURL: "https://api.mistral.ai/v1",
		key: settings.mistral_api_key
	} : modelId.startsWith("groq:") ? {
		name: "groq",
		prefix: "groq:",
		baseURL: "https://api.groq.com/openai/v1",
		key: settings.groq_api_key
	} : modelId.startsWith("nvidia:") ? {
		name: "nvidia",
		prefix: "nvidia:",
		baseURL: "https://integrate.api.nvidia.com/v1",
		key: settings.nvidia_api_key
	} : {
		name: "openrouter",
		prefix: "",
		baseURL: "https://openrouter.ai/api/v1",
		key: settings.api_key
	};
	if (!route.key) return new Response(`Add your ${route.name} API key on the Account tab.`, { status: 400 });
	const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
	const retryingFetch = async (input, init) => {
		let rpmWaits = 0;
		let transient = 0;
		for (;;) {
			let res;
			try {
				const timeoutSignal = AbortSignal.timeout(1e3 * 60 * 5);
				const signal = init?.signal ? AbortSignal.any ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal : timeoutSignal;
				res = await fetch(input, {
					...init,
					signal
				});
			} catch (e) {
				if (++transient > 4) throw new Error("Could not reach the model provider after several attempts: " + ((e instanceof Error ? e.message : String(e)) || "network error"));
				await sleep(Math.min(2e4, 2e3 * transient));
				continue;
			}
			if (res.status !== 429) {
				if ((res.status === 408 || res.status >= 500) && ++transient <= 4) {
					await sleep(Math.min(2e4, 2e3 * transient));
					continue;
				}
				return res;
			}
			const text = await res.clone().text();
			if (!(/per.?minute|rpm|requests per|rate.?limit/i.test(text) || !/quota|credit|balance|billing/i.test(text))) return res;
			await logEvent("status", "Rate limited — waiting 10s and retrying.", PHASE.coding);
			await sleep(1e4);
			if (++rpmWaits > 200) return res;
		}
	};
	const model = createOpenAICompatible({
		name: route.name,
		baseURL: route.baseURL,
		fetch: retryingFetch,
		headers: {
			Authorization: `Bearer ${route.key}`,
			...route.name === "openrouter" ? {
				"HTTP-Referer": new URL(request.url).origin,
				"X-Title": "Coderbot"
			} : {}
		}
	})(modelId.slice(route.prefix.length));
	let tools;
	if (isKaggle) {
		const { buildKaggleTools } = await import("./kaggle.server-D0FqkxbJ.mjs");
		tools = buildKaggleTools({
			sb: supa,
			notebookId: thread.kaggle_notebook_id
		}, { allowWrites: mode !== "plan" });
	} else {
		const { buildAgentTools } = await import("./agent-tools.server-DwA7hVk2.mjs");
		tools = buildAgentTools({
			sb: supa,
			userId,
			repoId: thread.repo_selection_id
		}, { allowWrites: mode !== "plan" });
	}
	const { data: attRows } = await supa.from("chat_attachments").select("name, mime_type, storage_path, code_only").eq("thread_id", threadId);
	let attachmentContext = "";
	if (attRows && attRows.length > 0) {
		const parts = ["The user uploaded these files; they are available to the coding runner under uploads/: " + attRows.map((a) => `uploads/${a.name}${a.code_only ? " (asset only — contents hidden from you)" : ""}`).join(", ") + "."];
		for (const a of attRows) {
			if (a.code_only || /^image\//.test(a.mime_type ?? "")) continue;
			const { data: blob } = await supa.storage.from("attachments").download(a.storage_path);
			if (!blob) continue;
			const text = (await blob.text()).slice(0, 2e4);
			parts.push(`--- uploads/${a.name} ---\n${text}`);
		}
		attachmentContext = parts.join("\n\n");
	}
	const systemPrompt = [
		isKaggle ? "You are Coderbot, an autonomous coding agent working on a single Kaggle notebook through a staged working copy of its source." : "You are Coderbot, an autonomous coding agent working on the user's repository through an in-app working copy.",
		isKaggle ? "Your tools edit a staged copy of the notebook source. Nothing reaches Kaggle until the user presses Commit, so you may edit freely. Always read_notebook before editing, and prefer edit_notebook for targeted changes." : "Your file tools edit a staged working copy. Nothing reaches GitHub until the user presses Commit, so you may edit freely.",
		"Never claim you changed code unless you actually called a write tool and it succeeded.",
		"Use search_web to look up current docs, package versions, APIs or fixes when you are not sure, instead of guessing — but prefer the repo's own code when the answer lives there.",
		isKaggle ? "" : "Before editing, read the files you are about to change. Prefer edit_file for small changes. You also have read-only reference-repo tools for other connected GitHub repos; use them when the user asks you to copy or adapt code from another repo, but only write changes to the current repo.",
		"When you finish, summarise what you changed, why, and anything the user needs to know or do.",
		modePrompts(isKaggle)[mode],
		thread.seed_summary ? `Context carried over from the previous chat:\n${thread.seed_summary}` : "",
		attachmentContext,
		ragContext
	].filter(Boolean).join("\n\n");
	let phase = PHASE.planning;
	let sawWrite = false;
	let sawCheck = false;
	return withSseHeartbeat(streamText({
		model,
		system: systemPrompt,
		messages: await convertToModelMessages(messages),
		tools,
		stopWhen: isStepCount(mode === "plan" ? 25 : mode === "debug" ? 50 : 35),
		experimental_parallelToolCalls: true,
		maxRetries: 2,
		onStepFinish: async (step) => {
			if (isKaggle && kaggleJobId) supa.from("coding_jobs").update({ updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", kaggleJobId);
			const toolCalls = step.toolCalls ?? [];
			if (toolCalls.length > 0) for (const call of toolCalls) {
				const name = call.toolName;
				const input = call.input ?? {};
				if (name === "write_notebook" || name === "edit_notebook") {
					if (sawCheck) phase = PHASE.debugging;
					else phase = PHASE.coding;
					sawWrite = true;
					await logEvent("action", name === "write_notebook" ? "Rewrote the notebook source" : "Edited the notebook source", phase);
				} else if (name === "read_notebook") await logEvent("action", "Read the notebook source", phase);
				else if (name === "search_notebook") await logEvent("action", `Searched the notebook for "${input.query ?? ""}"`, phase);
				else if (name === "batch_edit_notebook") {
					if (sawCheck) phase = PHASE.debugging;
					else phase = PHASE.coding;
					sawWrite = true;
					await logEvent("action", "Applied batch edits to the notebook source", phase);
				} else if (name === "write_file" || name === "edit_file" || name === "delete_file" || name === "batch_edit_files") {
					if (sawCheck) phase = PHASE.debugging;
					else phase = PHASE.coding;
					sawWrite = true;
					await logEvent("action", `${name === "write_file" ? "Wrote" : name === "edit_file" || name === "batch_edit_files" ? "Edited" : "Deleted"} ${input.path ?? "file"}`, phase);
				} else if (name === "batch_read_files") await logEvent("action", `Read ${Array.isArray(input.paths) ? input.paths.length : 0} files`, phase);
				else if (name === "check_code") {
					phase = PHASE.checking;
					sawCheck = true;
					await logEvent("action", "Checked the code I changed for problems", phase);
				} else if (name === "read_file") await logEvent("action", `Read ${input.path ?? "file"}`, phase);
				else if (name === "list_files") await logEvent("action", "Listed the repository files", phase);
				else if (name === "search_code") await logEvent("action", `Searched for "${input.query ?? ""}"`, phase);
				else if (name === "search_web") await logEvent("action", `Searched the web for "${input.query ?? ""}"`, phase);
				else if (name === "staged_changes") await logEvent("action", "Reviewed the staged changes", phase);
			}
			const reasoning = step.text?.trim();
			if (reasoning) {
				const truncated = reasoning.length > 800 ? reasoning.slice(0, Math.min(800, reasoning.lastIndexOf(".", 700))) + "..." : reasoning;
				await logEvent("thought", truncated, phase);
			}
		}
	}).toUIMessageStreamResponse({
		originalMessages: messages,
		onFinish: async ({ messages: finalMessages }) => {
			const assistant = finalMessages[finalMessages.length - 1];
			if (assistant?.role === "assistant") {
				const parts = isKaggle ? [...assistant.parts.filter((p) => {
					return !String(p.type ?? "").startsWith("tool-call");
				}), {
					type: "data-run",
					data: {
						jobId: kaggleJobId ?? void 0,
						taskId,
						kaggle: true
					}
				}] : assistant.parts;
				await supa.from("chat_messages").insert({
					thread_id: threadId,
					user_id: userId,
					role: "assistant",
					parts
				});
				await supa.from("chat_threads").update({ updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", threadId);
			}
			await logEvent("status", sawWrite ? "Finished the task and staged the changes." : mode === "plan" ? "Finished." : `Finished without changing ${isKaggle ? "the notebook" : "any file"} — the agent only replied. Try again with a more specific instruction.`, PHASE.done);
			if (isKaggle && kaggleJobId) await supa.from("coding_jobs").update({
				status: "completed",
				summary: sawWrite ? "Finished and staged the notebook changes." : "Finished without changing the notebook.",
				finished_at: (/* @__PURE__ */ new Date()).toISOString(),
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", kaggleJobId);
		},
		onError: (error) => {
			const msg = error instanceof Error ? error.message : String(error);
			logEvent("error", msg, PHASE.done);
			if (isKaggle && kaggleJobId) supa.from("coding_jobs").update({
				status: "failed",
				error: msg.slice(0, 500),
				finished_at: (/* @__PURE__ */ new Date()).toISOString(),
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", kaggleJobId);
			return msg;
		}
	}));
} } } });
var $$splitComponentImporter$3 = () => import("./chat-Bng-bBX-.mjs");
var Route$14 = createFileRoute("/_authenticated/chat")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitErrorComponentImporter = () => import("./account-CkrH_-D_.mjs");
var $$splitComponentImporter$2 = () => import("./account-DdqVYGIj.mjs");
var Route$13 = createFileRoute("/_authenticated/account")({
	head: () => ({ meta: [
		{ title: "Account — Coderbot" },
		{
			name: "description",
			content: "Manage your GitHub connection, Kaggle notebooks, provider API keys and models."
		},
		{
			property: "og:title",
			content: "Account — Coderbot"
		},
		{
			property: "og:description",
			content: "Manage your GitHub connection, Kaggle notebooks, provider API keys and models."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component"),
	errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent")
});
var $$splitComponentImporter$1 = () => import("./chat.index-BV0qDhi-.mjs");
var Route$12 = createFileRoute("/_authenticated/chat/")({
	head: () => ({ meta: [
		{ title: "Chats — Coderbot" },
		{
			name: "description",
			content: "Your coding chats. Start a new one or pick up where you left off."
		},
		{
			property: "og:title",
			content: "Chats — Coderbot"
		},
		{
			property: "og:description",
			content: "Your coding chats. Start a new one or pick up where you left off."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var Route$11 = createFileRoute("/api/github/callback")({ server: { handlers: { GET: async ({ request }) => {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	if (!code || !state) return new Response("Missing code/state", { status: 400 });
	try {
		const { verifyState } = await import("./oauth-state.server-MOpra_96.mjs");
		const uid = verifyState(state).uid;
		if (!uid) throw new Error("No user id in state");
		const clientId = processModule.env.GITHUB_CLIENT_ID;
		const clientSecret = processModule.env.GITHUB_CLIENT_SECRET;
		if (!clientId || !clientSecret) return new Response("GitHub OAuth not configured", { status: 500 });
		const tok = await (await fetch("https://github.com/login/oauth/access_token", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json"
			},
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				code,
				redirect_uri: `${url.protocol}//${url.host}/api/github/callback`
			})
		})).json();
		if (!tok.access_token) return new Response(`GitHub token exchange failed: ${tok.error_description ?? tok.error ?? "unknown"}`, { status: 400 });
		const gu = await (await fetch("https://api.github.com/user", { headers: {
			Authorization: `Bearer ${tok.access_token}`,
			Accept: "application/vnd.github+json",
			"User-Agent": "coderbot-app"
		} })).json();
		const { supabaseAdmin } = await import("./client.server-KzwUIAkW.mjs");
		const { error } = await supabaseAdmin.from("github_connections").upsert({
			user_id: uid,
			github_user_id: gu.id,
			github_login: gu.login,
			avatar_url: gu.avatar_url,
			access_token: tok.access_token,
			scope: tok.scope ?? null
		}, { onConflict: "user_id" });
		if (error) throw error;
		return new Response(null, {
			status: 302,
			headers: { Location: "/account?connected=1" }
		});
	} catch (err) {
		console.error("github callback error", err);
		const msg = err instanceof Error ? err.message : String(err);
		return new Response(`OAuth error: ${msg}`, { status: 400 });
	}
} } } });
var $$splitComponentImporter = () => import("./chat._threadId-DZxdnKuQ.mjs");
var Route$10 = createFileRoute("/_authenticated/chat/$threadId")({
	head: () => ({ meta: [
		{ title: "Chat — Coderbot" },
		{
			name: "description",
			content: "Work with the Coderbot agent on your repo or Kaggle notebook."
		},
		{
			property: "og:title",
			content: "Chat — Coderbot"
		},
		{
			property: "og:description",
			content: "Work with the Coderbot agent on your repo or Kaggle notebook."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
function adminClient() {
	return createClient(processModule.env.SUPABASE_URL, processModule.env.SUPABASE_SERVICE_ROLE_KEY, { auth: {
		storage: void 0,
		persistSession: false,
		autoRefreshToken: false
	} });
}
async function authJobRequest(request) {
	const jobId = request.headers.get("x-job-id");
	const secret = request.headers.get("x-job-secret");
	if (!jobId || !secret) throw new Response("missing job auth", { status: 401 });
	const sb = adminClient();
	const { data: job, error } = await sb.from("coding_jobs").select("*").eq("id", jobId).maybeSingle();
	if (error || !job) throw new Response("no job", { status: 404 });
	if (job.hmac_secret !== secret) throw new Response("bad secret", { status: 401 });
	return {
		job,
		sb
	};
}
var MAX_READ = 6e4;
function repoParts(repo) {
	const [owner, name] = repo.split("/");
	if (!owner || !name) throw new Error("Use repo as owner/name");
	return {
		owner,
		name
	};
}
var Route$9 = createFileRoute("/api/public/jobs/reference")({ server: { handlers: { POST: async ({ request }) => {
	let ctx;
	try {
		ctx = await authJobRequest(request);
	} catch (r) {
		return r;
	}
	const { job, sb } = ctx;
	const body = await request.json().catch(() => ({}));
	const currentRepoId = job.repo_selection_id;
	const findRepo = async (repo) => {
		const { owner, name } = repoParts(repo);
		const { data, error } = await sb.from("repo_selections").select("id, owner, name").eq("user_id", job.user_id).eq("owner", owner).eq("name", name).maybeSingle();
		if (error) throw error;
		if (!data) throw new Error(`Reference repo not found or not connected: ${repo}`);
		return data;
	};
	try {
		if (body.action === "list_repos") {
			const { data, error } = await sb.from("repo_selections").select("owner, name, indexed_at").eq("user_id", job.user_id).neq("id", currentRepoId).order("owner");
			if (error) throw error;
			return Response.json({ repos: (data ?? []).map((r) => `${r.owner}/${r.name}${r.indexed_at ? "" : " (not indexed/synced yet)"}`) });
		}
		if (!body.repo) throw new Error("repo is required");
		const repo = await findRepo(body.repo);
		if (body.action === "list_files") {
			const { data, error } = await sb.from("working_files").select("path").eq("repo_selection_id", repo.id).neq("status", "deleted").order("path");
			if (error) throw error;
			let rows = data ?? [];
			if (body.prefix) rows = rows.filter((r) => r.path.includes(body.prefix));
			return Response.json({
				repo: body.repo,
				count: rows.length,
				files: rows.slice(0, 800).map((r) => r.path)
			});
		}
		if (body.action === "read_file") {
			if (!body.path) throw new Error("path is required");
			const { data, error } = await sb.from("working_files").select("content, status").eq("repo_selection_id", repo.id).eq("path", body.path).maybeSingle();
			if (error) throw error;
			if (!data || data.status === "deleted") throw new Error(`Not found in ${body.repo}: ${body.path}`);
			const content = data.content ?? "";
			return Response.json({
				repo: body.repo,
				path: body.path,
				content: content.slice(0, MAX_READ),
				truncated: content.length > MAX_READ
			});
		}
		if (body.action === "search_code") {
			if (!body.query) throw new Error("query is required");
			const { data, error } = await sb.from("working_files").select("path, content").eq("repo_selection_id", repo.id).neq("status", "deleted");
			if (error) throw error;
			const re = body.regex ? new RegExp(body.query, "i") : new RegExp(body.query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
			const limit = Math.min(body.max_results ?? 60, 200);
			const hits = [];
			for (const f of data ?? []) {
				const lines = (f.content ?? "").split("\n");
				for (let i = 0; i < lines.length; i++) if (re.test(lines[i])) {
					hits.push({
						path: f.path,
						line: i + 1,
						text: lines[i].slice(0, 200).trim()
					});
					if (hits.length >= limit) break;
				}
				if (hits.length >= limit) break;
			}
			return Response.json({
				repo: body.repo,
				count: hits.length,
				hits
			});
		}
		throw new Error("Unknown reference action");
	} catch (e) {
		return Response.json({ error: e instanceof Error ? e.message : "reference lookup failed" }, { status: 400 });
	}
} } } });
/**
* Called by the runner during long-running sessions (debug/improve modes) to
* check if the user has sent any new messages while the AI is working.
*/
var Route$8 = createFileRoute("/api/public/jobs/new-messages")({ server: { handlers: { POST: async ({ request }) => {
	let ctx;
	try {
		ctx = await authJobRequest(request);
	} catch (r) {
		return r;
	}
	const { job, sb } = ctx;
	const lastMessageCount = (await request.json().catch(() => ({}))).lastMessageCount ?? 0;
	if (!job.thread_id) return Response.json({ newMessages: [] });
	const { data: allMessages } = await sb.from("chat_messages").select("role, parts, created_at").eq("thread_id", job.thread_id).eq("role", "user").order("created_at", { ascending: true });
	if (!allMessages || allMessages.length === 0) return Response.json({ newMessages: [] });
	const parseContent = (parts) => {
		if (!Array.isArray(parts)) return "";
		return parts.map((p) => p?.type === "text" ? p.text ?? "" : "").join("");
	};
	const newMessages = allMessages.map((m) => ({
		content: parseContent(m.parts),
		created_at: m.created_at
	})).slice(lastMessageCount);
	return Response.json({ newMessages });
} } } });
var Route$7 = createFileRoute("/api/public/jobs/log")({ server: { handlers: { POST: async ({ request }) => {
	let ctx;
	try {
		ctx = await authJobRequest(request);
	} catch (r) {
		return r;
	}
	const { job, sb } = ctx;
	const body = await request.json().catch(() => ({}));
	const line = String(body.line ?? "").slice(0, 2e3);
	const next = (job.logs ?? "") + (job.logs ? "\n" : "") + `[${(/* @__PURE__ */ new Date()).toISOString().slice(11, 19)}] ${line}`;
	const trimmed = next.length > 2e5 ? next.slice(-2e5) : next;
	await sb.from("coding_jobs").update({
		logs: trimmed,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", job.id);
	return Response.json({ ok: true });
} } } });
var Route$6 = createFileRoute("/api/public/jobs/index-progress")({ server: { handlers: { POST: async ({ request }) => {
	let ctx;
	try {
		ctx = await authJobRequest(request);
	} catch (r) {
		return r;
	}
	const { job, sb } = ctx;
	const body = await request.json().catch(() => ({}));
	await sb.from("coding_jobs").update({
		progress_current: Math.max(0, Math.floor(body.current ?? 0)),
		progress_total: Math.max(0, Math.floor(body.total ?? 0)),
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", job.id);
	return Response.json({ ok: true });
} } } });
var Route$5 = createFileRoute("/api/public/jobs/index-batch")({ server: { handlers: { POST: async ({ request }) => {
	let ctx;
	try {
		ctx = await authJobRequest(request);
	} catch (r) {
		return r;
	}
	const { job, sb } = ctx;
	const { file, chunks } = await request.json();
	if (!file?.path) return new Response("bad file", { status: 400 });
	const { data: existing } = await sb.from("repo_files").select("id, sha").eq("repo_selection_id", job.repo_selection_id).eq("path", file.path).maybeSingle();
	if (existing && existing.sha === file.sha) return Response.json({
		ok: true,
		unchanged: true
	});
	const fileRow = {
		user_id: job.user_id,
		repo_selection_id: job.repo_selection_id,
		path: file.path,
		sha: file.sha,
		size: file.size,
		language: file.language,
		summary: file.summary,
		symbol_outline: (file.symbols ?? []).map((s) => s.name).join(", ").slice(0, 2e3),
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	};
	let fileId;
	if (existing) {
		await sb.from("repo_files").update(fileRow).eq("id", existing.id);
		fileId = existing.id;
		await sb.from("repo_file_chunks").delete().eq("repo_file_id", fileId);
		await sb.from("repo_symbols").delete().eq("repo_file_id", fileId);
	} else {
		const { data: ins, error } = await sb.from("repo_files").insert(fileRow).select("id").single();
		if (error) return new Response(error.message, { status: 500 });
		fileId = ins.id;
	}
	if (chunks?.length) {
		const rows = chunks.map((c) => ({
			user_id: job.user_id,
			repo_selection_id: job.repo_selection_id,
			repo_file_id: fileId,
			chunk_index: c.chunk_index,
			content: c.content,
			embedding: c.embedding,
			token_count: c.token_count
		}));
		const { error } = await sb.from("repo_file_chunks").insert(rows);
		if (error) return new Response(error.message, { status: 500 });
	}
	if (file.symbols?.length) await sb.from("repo_symbols").insert(file.symbols.slice(0, 50).map((s) => ({
		user_id: job.user_id,
		repo_selection_id: job.repo_selection_id,
		repo_file_id: fileId,
		name: s.name,
		kind: s.kind,
		line: s.line
	})));
	return Response.json({ ok: true });
} } } });
/** The runner reports its thoughts and actions here so the app can show live activity. */
var Route$4 = createFileRoute("/api/public/jobs/event")({ server: { handlers: { POST: async ({ request }) => {
	let ctx;
	try {
		ctx = await authJobRequest(request);
	} catch (r) {
		return r;
	}
	const { job, sb } = ctx;
	if (!job.thread_id) return Response.json({ ok: true });
	const body = await request.json().catch(() => ({}));
	const kind = [
		"thought",
		"action",
		"status",
		"error"
	].includes(body.kind ?? "") ? body.kind : "status";
	await sb.from("agent_events").insert({
		user_id: job.user_id,
		thread_id: job.thread_id,
		task_id: job.task_id ?? job.id,
		agent_id: body.agent_id || "main",
		agent_label: body.agent_label || "Main agent",
		phase: (body.phase || "coding").slice(0, 32),
		kind,
		text: String(body.text ?? "").slice(0, 4e3)
	});
	return Response.json({ ok: true });
} } } });
/**
* Called by the runner just before the 6h GitHub Actions limit. Stores the
* checkpoint, then dispatches a fresh run that picks the task back up.
*/
var Route$3 = createFileRoute("/api/public/jobs/continue")({ server: { handlers: { POST: async ({ request }) => {
	let ctx;
	try {
		ctx = await authJobRequest(request);
	} catch (r) {
		return r;
	}
	const { job, sb } = ctx;
	const body = await request.json().catch(() => ({}));
	const { data: sel } = await sb.from("repo_selections").select("owner, name, working_branch").eq("id", job.repo_selection_id).single();
	const { data: conn } = await sb.from("github_connections").select("access_token").eq("user_id", job.user_id).maybeSingle();
	if (!sel || !conn?.access_token) return new Response("cannot continue: missing repo or GitHub token", { status: 400 });
	const secret = crypto.randomUUID() + crypto.randomUUID();
	const { data: next, error } = await sb.from("coding_jobs").insert({
		user_id: job.user_id,
		thread_id: job.thread_id,
		repo_selection_id: job.repo_selection_id,
		status: "queued",
		prompt: job.prompt,
		model: job.model,
		mode: job.mode,
		task_id: job.task_id ?? job.id,
		job_type: job.job_type,
		hmac_secret: secret,
		working_branch: job.working_branch,
		continue_of: job.id,
		checkpoint: body.checkpoint ?? {},
		logs: ""
	}).select("id").single();
	if (error) return new Response(`could not queue continuation: ${error.message}`, { status: 500 });
	const origin = new URL(request.url).origin;
	try {
		await ghFetch(`/repos/${sel.owner}/${sel.name}/dispatches`, conn.access_token, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				event_type: "lovable-coding-job",
				client_payload: {
					job_id: next.id,
					job_secret: secret,
					app_url: origin,
					working_branch: body.review_branch || job.working_branch || sel.working_branch
				}
			})
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		await sb.from("coding_jobs").update({
			status: "failed",
			error: `continuation dispatch: ${msg.slice(0, 300)}`
		}).eq("id", next.id);
		return new Response(`dispatch failed: ${msg.slice(0, 120)}`, { status: 502 });
	}
	await sb.from("coding_jobs").update({
		status: "checkpointed",
		finished_at: (/* @__PURE__ */ new Date()).toISOString(),
		hmac_secret: null,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", job.id);
	return Response.json({
		ok: true,
		job_id: next.id
	});
} } } });
var Route$2 = createFileRoute("/api/public/jobs/complete")({ server: { handlers: { POST: async ({ request }) => {
	let ctx;
	try {
		ctx = await authJobRequest(request);
	} catch (r) {
		return r;
	}
	const { job, sb } = ctx;
	const body = await request.json().catch(() => ({}));
	const status = body.status === "failed" ? "failed" : body.status === "awaiting_review" ? "awaiting_review" : "completed";
	const changed = Array.isArray(body.changed_files) ? body.changed_files.slice(0, 500) : [];
	if (job.thread_id) {
		const text = status === "failed" ? body.summary || body.error || "The GitHub Actions run failed." : body.summary || "The GitHub Actions run completed.";
		const parts = [{
			type: "text",
			text: (status === "failed" ? "❌ " : status === "awaiting_review" ? "🧪 " : "✅ ") + text
		}];
		parts.push({
			type: "data-run",
			data: {
				jobId: job.id,
				taskId: job.task_id ?? job.id,
				status,
				reviewBranch: body.review_branch ?? null,
				baseBranch: body.base_branch ?? job.working_branch ?? null,
				commitSha: body.commit_sha ?? null,
				files: changed
			}
		});
		const { error: messageError } = await sb.from("chat_messages").upsert({
			id: job.id,
			thread_id: job.thread_id,
			user_id: job.user_id,
			role: "assistant",
			parts
		});
		if (messageError) return Response.json({ error: `could not save chat result: ${messageError.message}` }, { status: 500 });
	}
	const { error: updateError } = await sb.from("coding_jobs").update({
		status,
		commit_sha: body.commit_sha ?? null,
		error: body.error ?? null,
		summary: body.summary ?? null,
		review_branch: body.review_branch ?? null,
		changed_files: changed,
		diff: body.diff ? { patch: body.diff.slice(0, 4e5) } : {},
		hmac_secret: null,
		finished_at: (/* @__PURE__ */ new Date()).toISOString(),
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", job.id);
	if (updateError) return Response.json({ error: `could not finish job: ${updateError.message}` }, { status: 500 });
	if (status === "completed" && job.job_type === "index") await sb.from("repo_selections").update({ indexed_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", job.repo_selection_id);
	return Response.json({ ok: true });
} } } });
var Route$1 = createFileRoute("/api/public/jobs/claim")({ server: { handlers: { POST: async ({ request }) => {
	let ctx;
	try {
		ctx = await authJobRequest(request);
	} catch (r) {
		return r;
	}
	const { job, sb } = ctx;
	const isIndex = job.job_type === "index";
	const [{ data: msgs }, { data: or }, { data: gh }, { data: sel }, { data: thr }, { data: atts }] = await Promise.all([
		isIndex ? Promise.resolve({ data: [] }) : sb.from("chat_messages").select("role, parts").eq("thread_id", job.thread_id).order("created_at"),
		sb.from("openrouter_settings").select("api_key, mistral_api_key, groq_api_key, nvidia_api_key, embedding_provider, embedding_model").eq("user_id", job.user_id).maybeSingle(),
		sb.from("github_connections").select("access_token").eq("user_id", job.user_id).maybeSingle(),
		sb.from("repo_selections").select("owner, name, working_branch").eq("id", job.repo_selection_id).single(),
		isIndex || !job.thread_id ? Promise.resolve({ data: null }) : sb.from("chat_threads").select("sub_agents, seed_summary").eq("id", job.thread_id).maybeSingle(),
		isIndex || !job.thread_id ? Promise.resolve({ data: [] }) : sb.from("chat_attachments").select("name, mime_type, storage_path, code_only").eq("thread_id", job.thread_id)
	]);
	if (!gh?.access_token) return new Response("no github token", { status: 400 });
	if (!or) return new Response("no provider settings", { status: 400 });
	const provider = (job.model ?? "").startsWith("mistral:") ? "mistral" : (job.model ?? "").startsWith("groq:") ? "groq" : (job.model ?? "").startsWith("nvidia:") ? "nvidia" : "openrouter";
	const providerKey = provider === "mistral" ? or.mistral_api_key : provider === "groq" ? or.groq_api_key : provider === "nvidia" ? or.nvidia_api_key : or.api_key;
	const embeddingKey = or.embedding_provider === "mistral" ? or.mistral_api_key : or.embedding_provider === "nvidia" ? or.nvidia_api_key : or.api_key;
	if (!providerKey) return new Response(`no ${provider} key`, { status: 400 });
	if (isIndex && !embeddingKey) return new Response(`no ${or.embedding_provider} embedding key`, { status: 400 });
	await sb.from("coding_jobs").update({
		status: "running",
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", job.id);
	const partsText = (parts) => {
		if (!Array.isArray(parts)) return "";
		return parts.map((p) => p?.type === "text" ? p.text ?? "" : "").join("");
	};
	const messages = (msgs ?? []).map((m) => ({
		role: m.role,
		content: partsText(m.parts)
	}));
	if (!isIndex && messages[messages.length - 1]?.content?.trim() !== job.prompt.trim()) messages.push({
		role: "user",
		content: job.prompt
	});
	const mode = job.mode ?? "build";
	const MODE_PROMPTS = {
		plan: "MODE: PLAN. Explore and reason about the repository but do NOT change any file. End with a concrete step-by-step plan, then call finish.",
		build: "MODE: BUILD. Implement the request end to end. Read what you need, make focused edits, then call check_code. If it reports problems, fix them and check again. Repeat until clean AND the task is genuinely complete, then call finish.",
		debug: "MODE: DEBUG (long-running session). Find and fix bugs systematically. This session runs until you exhaust all meaningful bugs or hit the 6-hour GitHub Actions limit. After fixing initial bugs, proactively search for more issues: review error handling, edge cases, performance bottlenecks, security concerns, and logic errors. When you think you're done, systematically verify by checking areas you haven't reviewed yet. Only call finish when you've thoroughly checked the codebase and cannot find any more real bugs. If you hit the time limit, your work will be checkpointed and you can continue on a fresh runner. IMPORTANT: The user can send you messages while you're working - if you see new user messages during your run, read them and incorporate that feedback into your current work without stopping.",
		improve: "MODE: IMPROVE (long-running session). Improve the codebase continuously. This session runs until you exhaust all meaningful improvements or hit the 6-hour GitHub Actions limit. After initial improvements, proactively seek more: optimization opportunities, code quality enhancements, valuable missing features, refactoring to reduce duplication, better patterns, and hardening weak spots. When you think you're done, systematically verify by reviewing areas you haven't improved yet. Only call finish when you've exhausted all meaningful improvements. If you hit the time limit, your work will be checkpointed and you can continue on a fresh runner. IMPORTANT: The user can send you messages while you're working - if you see new user messages during your run, read them and incorporate that feedback into your current work without stopping."
	};
	const sub_agents = (Array.isArray(thr?.sub_agents) ? thr.sub_agents : []).filter((a) => a && a.id && a.model).map((a) => ({
		id: a.id,
		label: a.label || a.id,
		model: a.model,
		instructions: a.instructions ?? ""
	}));
	const { data: referenceRepos } = await sb.from("repo_selections").select("owner, name, indexed_at").eq("user_id", job.user_id).neq("id", job.repo_selection_id).order("owner");
	const attachments = [];
	for (const a of atts ?? []) {
		const { data: signed } = await sb.storage.from("attachments").createSignedUrl(a.storage_path, 3600 * 6);
		if (signed?.signedUrl) attachments.push({
			name: a.name,
			mime_type: a.mime_type,
			code_only: a.code_only,
			url: signed.signedUrl
		});
	}
	const system = [
		"You are Coderbot, an autonomous coding agent running inside GitHub Actions in the repo " + sel.owner + "/" + sel.name + ".",
		"Working branch: " + sel.working_branch + ".",
		"You have shell access and tools to list, read, search, write, edit and delete files, plus check_code to verify your work and update_plan to keep the user informed. You also have read-only reference-repo tools for other connected GitHub repos; use them when the user asks you to copy or adapt code from another repo, but only write changes to the current repo.",
		"Work in as few model turns as possible: put EVERY independent tool call you need for a step into the SAME turn (reads, globs and searches all run in parallel), batch file reads with read_files, and use multi_edit for several edits at once instead of one call per edit. Never spend a turn on a single trivial read when you could have asked for five.",
		"Never claim you changed a file unless a write tool actually succeeded. Read files before editing them and prefer edit_file for small changes.",
		"Call update_plan early with the steps you intend to take, and keep it current as you go.",
		"Use search_web to look up current docs, package versions, APIs or fixes when you are not sure, instead of guessing — but prefer the repo's own code when the answer lives there.",
		"When the task is complete and check_code is clean, call `finish`. The summary is shown to the user as your chat reply: state what you built, then list every file you changed with a one-line description of the change (and which agent made it). Also give a conventional-style commit message.",
		"You never land code on the user's branch. The runner pushes your work to a temporary review branch and the user approves the merge in the app, so make the summary complete enough to review from.",
		"Do NOT run installers or other long-running commands unless required. Do NOT run git commit or git push yourself — the runner handles that.",
		sub_agents.length ? "You have " + sub_agents.length + " sub-agent(s) that run in parallel on this same checkout: " + sub_agents.map((a) => `${a.id} (${a.label})${a.instructions ? " — scope: " + a.instructions : ""}`).join("; ") + ". Divide the work into " + (sub_agents.length + 1) + " roughly equal shares — one per sub-agent plus one for yourself — and issue all delegate calls for a round in the SAME turn. Each assignment must be a substantial workstream described in at least a paragraph (goal, the files it owns, what to implement, how to verify), never a single small errand. When a round of sub-agents reports back, immediately delegate the next comparable chunk to each of them if meaningful work remains; only stop delegating when what is left is too small to be worth splitting. Never give two sub-agents the same file, and report what each sub-agent did in your final summary." : "",
		referenceRepos?.length ? "Read-only reference repos available for copying/adapting code snippets: " + referenceRepos.map((r) => `${r.owner}/${r.name}${r.indexed_at ? "" : " (sync/index may be stale or empty)"}`).join(", ") + ". Use list_reference_files, read_reference_file, and search_reference_code to inspect them. Do not edit reference repos." : "",
		attachments.length ? "The user uploaded files; the runner placed them in the `uploads/` folder of the checkout: " + attachments.map((a) => `uploads/${a.name}${a.code_only ? " (asset only — use it from code, its contents are not shown to you)" : ""}`).join(", ") + "." : "",
		thr?.seed_summary ? "Context carried over from the user's previous chat (summary): " + thr.seed_summary : "",
		MODE_PROMPTS[mode]
	].filter(Boolean).join(" ");
	return Response.json({
		job_type: job.job_type,
		mode,
		task_id: job.task_id ?? job.id,
		checkpoint: job.checkpoint ?? null,
		prompt: job.prompt,
		model: job.model,
		openrouter_key: or?.api_key ?? null,
		mistral_key: or.mistral_api_key,
		groq_key: or.groq_api_key,
		nvidia_key: or.nvidia_api_key,
		embedding_provider: or.embedding_provider,
		embedding_model: or.embedding_model,
		embedding_key: embeddingKey,
		system,
		messages,
		repo: {
			owner: sel.owner,
			name: sel.name
		},
		working_branch: sel.working_branch,
		sub_agents,
		attachments
	});
} } } });
var Route = createFileRoute("/api/public/jobs/checkpoint")({ server: { handlers: { POST: async ({ request }) => {
	let ctx;
	try {
		ctx = await authJobRequest(request);
	} catch (r) {
		return r;
	}
	const { job, sb } = ctx;
	const ck = (await request.json().catch(() => ({}))).checkpoint;
	await sb.from("coding_jobs").update({
		status: "checkpointed",
		checkpoint: ck ?? {},
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", job.id);
	return Response.json({ ok: true });
} } } });
var AuthRoute = Route$18.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$19
});
var AuthenticatedRouteRoute = Route$17.update({
	id: "/_authenticated",
	getParentRoute: () => Route$19
});
var IndexRoute = Route$16.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$19
});
var ApiChatRoute = Route$15.update({
	id: "/api/chat",
	path: "/api/chat",
	getParentRoute: () => Route$19
});
var AuthenticatedChatRoute = Route$14.update({
	id: "/chat",
	path: "/chat",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedAccountRoute = Route$13.update({
	id: "/account",
	path: "/account",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedChatIndexRoute = Route$12.update({
	id: "/",
	path: "/",
	getParentRoute: () => AuthenticatedChatRoute
});
var ApiGithubCallbackRoute = Route$11.update({
	id: "/api/github/callback",
	path: "/api/github/callback",
	getParentRoute: () => Route$19
});
var AuthenticatedChatThreadIdRoute = Route$10.update({
	id: "/$threadId",
	path: "/$threadId",
	getParentRoute: () => AuthenticatedChatRoute
});
var ApiPublicJobsReferenceRoute = Route$9.update({
	id: "/api/public/jobs/reference",
	path: "/api/public/jobs/reference",
	getParentRoute: () => Route$19
});
var ApiPublicJobsNewMessagesRoute = Route$8.update({
	id: "/api/public/jobs/new-messages",
	path: "/api/public/jobs/new-messages",
	getParentRoute: () => Route$19
});
var ApiPublicJobsLogRoute = Route$7.update({
	id: "/api/public/jobs/log",
	path: "/api/public/jobs/log",
	getParentRoute: () => Route$19
});
var ApiPublicJobsIndexProgressRoute = Route$6.update({
	id: "/api/public/jobs/index-progress",
	path: "/api/public/jobs/index-progress",
	getParentRoute: () => Route$19
});
var ApiPublicJobsIndexBatchRoute = Route$5.update({
	id: "/api/public/jobs/index-batch",
	path: "/api/public/jobs/index-batch",
	getParentRoute: () => Route$19
});
var ApiPublicJobsEventRoute = Route$4.update({
	id: "/api/public/jobs/event",
	path: "/api/public/jobs/event",
	getParentRoute: () => Route$19
});
var ApiPublicJobsContinueRoute = Route$3.update({
	id: "/api/public/jobs/continue",
	path: "/api/public/jobs/continue",
	getParentRoute: () => Route$19
});
var ApiPublicJobsCompleteRoute = Route$2.update({
	id: "/api/public/jobs/complete",
	path: "/api/public/jobs/complete",
	getParentRoute: () => Route$19
});
var ApiPublicJobsClaimRoute = Route$1.update({
	id: "/api/public/jobs/claim",
	path: "/api/public/jobs/claim",
	getParentRoute: () => Route$19
});
var ApiPublicJobsCheckpointRoute = Route.update({
	id: "/api/public/jobs/checkpoint",
	path: "/api/public/jobs/checkpoint",
	getParentRoute: () => Route$19
});
var AuthenticatedChatRouteChildren = {
	AuthenticatedChatThreadIdRoute,
	AuthenticatedChatIndexRoute
};
var AuthenticatedRouteRouteChildren = {
	AuthenticatedAccountRoute,
	AuthenticatedChatRoute: AuthenticatedChatRoute._addFileChildren(AuthenticatedChatRouteChildren)
};
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	AuthRoute,
	ApiChatRoute,
	ApiGithubCallbackRoute,
	ApiPublicJobsCheckpointRoute,
	ApiPublicJobsClaimRoute,
	ApiPublicJobsCompleteRoute,
	ApiPublicJobsContinueRoute,
	ApiPublicJobsEventRoute,
	ApiPublicJobsIndexBatchRoute,
	ApiPublicJobsIndexProgressRoute,
	ApiPublicJobsLogRoute,
	ApiPublicJobsNewMessagesRoute,
	ApiPublicJobsReferenceRoute
};
var routeTree = Route$19._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
