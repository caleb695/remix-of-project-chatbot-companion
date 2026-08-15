import { c as createServerFn, u as getRequest } from "./createServerFn-BFFE07zL.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-UH_Jp6hR.mjs";
import { Ft as stringType, Mt as enumType, Pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { t as createServerRpc } from "./createServerRpc-MBa5GZ-L.mjs";
import { t as ghFetch } from "./github.server-liDhNs7u.mjs";
import { Buffer } from "node:buffer";
//#region node_modules/.nitro/vite/services/ssr/assets/jobs.functions-BL3JVC5g.js
var contentsPath = (owner, name, filePath) => `/repos/${owner}/${name}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`;
/** Write a file into the user's repo through the Contents API. */
async function putRepoFile(args) {
	let sha;
	try {
		sha = (await ghFetch(`${contentsPath(args.owner, args.name, args.path)}?ref=${encodeURIComponent(args.branch)}`, args.token)).sha;
	} catch {}
	try {
		await ghFetch(contentsPath(args.owner, args.name, args.path), args.token, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: args.message,
				content: Buffer.from(args.content, "utf8").toString("base64"),
				branch: args.branch,
				...sha ? { sha } : {}
			})
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		if (/GitHub 404/.test(msg)) throw new Error(`GitHub 404 writing ${args.path} on ${args.owner}/${args.name}@${args.branch}. Reconnect GitHub to grant the required “workflow” permission. If this is an organization repo, an organization admin may also need to approve the OAuth app. Detail: ${msg.slice(0, 200)}`);
		throw e;
	}
}
/**
* Repos keep their own copy of the runner, so a runner fix only reaches them
* when the files are rewritten. Compare the version stamped in the installed
* workflow and refresh both files when it is behind.
*/
async function refreshRunnerIfStale(args) {
	const { WORKFLOW_YML, RUNNER_MJS, RUNNER_VERSION } = await import("./workflow-template.server-B3YexB9K.mjs");
	if (await ghFetch(`${contentsPath(args.owner, args.name, ".github/workflows/lovable-coder.yml")}?ref=${encodeURIComponent(args.branch)}`, args.token, { headers: { Accept: "application/vnd.github.raw+json" } }).then((t) => Number(/runner version (\d+)/.exec(String(t))?.[1] ?? 0)).catch(() => 0) >= RUNNER_VERSION) return;
	const message = `chore: update Lovable coder runner to v${RUNNER_VERSION}`;
	const runner = "scripts/lovable-coder/runner.mjs";
	const workflow = ".github/workflows/lovable-coder.yml";
	await putRepoFile({
		...args,
		path: runner,
		content: RUNNER_MJS,
		message
	});
	await putRepoFile({
		...args,
		path: workflow,
		content: WORKFLOW_YML,
		message
	});
}
var installCoderWorkflow_createServerFn_handler = createServerRpc({
	id: "383c2b9874e19cea47ee663539bd20129142921efe99c79ed3fd099b06632900",
	name: "installCoderWorkflow",
	filename: "src/lib/jobs.functions.ts"
}, (opts) => installCoderWorkflow.__executeServer(opts));
var installCoderWorkflow = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({ repoId: stringType().uuid() }).parse(i)).handler(installCoderWorkflow_createServerFn_handler, async ({ context, data }) => {
	const { data: sel, error } = await context.supabase.from("repo_selections").select("*").eq("id", data.repoId).single();
	if (error) throw error;
	const { data: conn } = await context.supabase.from("github_connections").select("access_token, scope").maybeSingle();
	if (!conn) throw new Error("Connect GitHub first");
	if (!new Set((conn.scope ?? "").split(/[ ,]+/).filter(Boolean)).has("workflow")) throw new Error("Reconnect GitHub from the Account tab to grant the required “workflow” permission, then try again.");
	const { WORKFLOW_YML, RUNNER_MJS } = await import("./workflow-template.server-B3YexB9K.mjs");
	const branch = sel.working_branch || sel.default_branch;
	const base = {
		token: conn.access_token,
		owner: sel.owner,
		name: sel.name,
		branch
	};
	const message = "chore: install Lovable coder workflow";
	const runner = "scripts/lovable-coder/runner.mjs";
	const workflow = ".github/workflows/lovable-coder.yml";
	await putRepoFile({
		...base,
		path: workflow,
		content: WORKFLOW_YML,
		message
	});
	await putRepoFile({
		...base,
		path: runner,
		content: RUNNER_MJS,
		message
	});
	await context.supabase.from("repo_selections").update({ workflow_installed_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", data.repoId);
	return {
		ok: true,
		alreadyInstalled: false
	};
});
var enqueueCodingJob_createServerFn_handler = createServerRpc({
	id: "b58c2ec13ae92fdd06b49b3664dd704be7eaac97e3d36288ae0a1524cae6596e",
	name: "enqueueCodingJob",
	filename: "src/lib/jobs.functions.ts"
}, (opts) => enqueueCodingJob.__executeServer(opts));
var enqueueCodingJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({
	threadId: stringType().uuid(),
	prompt: stringType().min(1).max(2e4),
	mode: enumType([
		"plan",
		"build",
		"debug",
		"improve"
	]).optional(),
	taskId: stringType().optional()
}).parse(i)).handler(enqueueCodingJob_createServerFn_handler, async ({ context, data }) => {
	const { data: thread, error: te } = await context.supabase.from("chat_threads").select("id, title, model, mode, repo_selection_id, repo_selections(owner, name, working_branch, workflow_installed_at)").eq("id", data.threadId).single();
	if (te) throw te;
	if (!thread.repo_selections) throw new Error("Thread has no repo");
	const repo = thread.repo_selections;
	if (!repo.workflow_installed_at) throw new Error("Install the coder workflow for this repo first");
	if (!thread.model) throw new Error("Pick a model for this chat first");
	const { data: conn } = await context.supabase.from("github_connections").select("access_token").maybeSingle();
	if (!conn) throw new Error("Connect GitHub");
	const mode = data.mode ?? (thread.mode || "build");
	const taskId = data.taskId ?? crypto.randomUUID();
	await context.supabase.from("chat_messages").insert({
		thread_id: data.threadId,
		user_id: context.userId,
		role: "user",
		parts: [{
			type: "text",
			text: data.prompt
		}]
	});
	if (thread.title === "New chat") await context.supabase.from("chat_threads").update({ title: data.prompt.slice(0, 60) }).eq("id", data.threadId);
	await context.supabase.from("agent_events").insert({
		user_id: context.userId,
		thread_id: data.threadId,
		task_id: taskId,
		agent_id: "main",
		agent_label: "Main agent",
		phase: "planning",
		kind: "status",
		text: "Queued on GitHub Actions — you can close this tab, the run continues."
	});
	try {
		await refreshRunnerIfStale({
			token: conn.access_token,
			owner: repo.owner,
			name: repo.name,
			branch: repo.working_branch
		});
	} catch {}
	const secret = crypto.randomUUID() + crypto.randomUUID();
	const requestUrl = new URL(getRequest().url);
	const appUrl = `${requestUrl.protocol}//${requestUrl.host}`;
	const { data: job, error: je } = await context.supabase.from("coding_jobs").insert({
		user_id: context.userId,
		thread_id: data.threadId,
		repo_selection_id: thread.repo_selection_id,
		status: "queued",
		prompt: data.prompt,
		model: thread.model,
		job_type: "code",
		mode,
		task_id: taskId,
		hmac_secret: secret,
		working_branch: repo.working_branch,
		logs: ""
	}).select().single();
	if (je) throw je;
	try {
		await ghFetch(`/repos/${repo.owner}/${repo.name}/dispatches`, conn.access_token, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				event_type: "lovable-coding-job",
				client_payload: {
					job_id: job.id,
					job_secret: secret,
					app_url: appUrl,
					working_branch: repo.working_branch
				}
			})
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		await context.supabase.from("coding_jobs").update({
			status: "failed",
			error: `dispatch: ${msg.slice(0, 400)}`
		}).eq("id", job.id);
		throw new Error(`GitHub dispatch failed: ${msg.slice(0, 200)}`);
	}
	return {
		jobId: job.id,
		taskId
	};
});
var getJob_createServerFn_handler = createServerRpc({
	id: "432b934c493a65b20930541aa425464f2c52d0a8716794775211fc250ec5a8e5",
	name: "getJob",
	filename: "src/lib/jobs.functions.ts"
}, (opts) => getJob.__executeServer(opts));
var getJob = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(getJob_createServerFn_handler, async ({ context, data }) => {
	const { data: job, error } = await context.supabase.from("coding_jobs").select("id, status, prompt, logs, error, summary, commit_sha, review_branch, changed_files, working_branch, task_id, job_type, finished_at, created_at, updated_at").eq("id", data.id).maybeSingle();
	if (error) throw error;
	if (job && job.status === "queued" && Date.now() - new Date(job.created_at).getTime() > 360 * 1e3) {
		const message = "The GitHub Actions runner never started this job. Re-install the workflow from Account, then try again.";
		await context.supabase.from("coding_jobs").update({
			status: "failed",
			error: message,
			finished_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", job.id);
		return {
			...job,
			status: "failed",
			error: message
		};
	}
	if (job && job.job_type === "kaggle" && job.status === "running" && Date.now() - new Date(job.updated_at).getTime() > 300 * 1e3) {
		const message = "The run stopped when the tab was closed. Any notebook edits made so far are staged — review them and re-run if needed.";
		await context.supabase.from("coding_jobs").update({
			status: "failed",
			error: message,
			finished_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", job.id);
		return {
			...job,
			status: "failed",
			error: message
		};
	}
	return job;
});
var getJobDiff_createServerFn_handler = createServerRpc({
	id: "ff56f97c1602fd8f21d00892d160b37595d659ba851a485a5c9265ce78de51cb",
	name: "getJobDiff",
	filename: "src/lib/jobs.functions.ts"
}, (opts) => getJobDiff.__executeServer(opts));
var getJobDiff = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(getJobDiff_createServerFn_handler, async ({ context, data }) => {
	const { data: job, error } = await context.supabase.from("coding_jobs").select("diff, changed_files, review_branch").eq("id", data.id).maybeSingle();
	if (error) throw error;
	return {
		patch: (job?.diff ?? {}).patch ?? "",
		files: job?.changed_files ?? [],
		review_branch: job?.review_branch ?? null
	};
});
var approveJob_createServerFn_handler = createServerRpc({
	id: "1a3b9034e7640601f7d2fd280fa3f78f56ec077718405469a799410b4a1f2d8a",
	name: "approveJob",
	filename: "src/lib/jobs.functions.ts"
}, (opts) => approveJob.__executeServer(opts));
var approveJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(approveJob_createServerFn_handler, async ({ context, data }) => {
	const { data: job, error } = await context.supabase.from("coding_jobs").select("id, status, review_branch, working_branch, repo_selection_id, summary").eq("id", data.id).single();
	if (error) throw error;
	if (!job.review_branch) throw new Error("This run has nothing to approve");
	const { data: sel } = await context.supabase.from("repo_selections").select("owner, name, working_branch").eq("id", job.repo_selection_id).single();
	const { data: conn } = await context.supabase.from("github_connections").select("access_token").maybeSingle();
	if (!sel || !conn?.access_token) throw new Error("Connect GitHub first");
	const base = job.working_branch || sel.working_branch;
	let merged = null;
	try {
		merged = (await ghFetch(`/repos/${sel.owner}/${sel.name}/merges`, conn.access_token, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				base,
				head: job.review_branch,
				commit_message: `Coderbot: ${job.summary?.slice(0, 60) ?? "approved changes"}`
			})
		}))?.sha ?? null;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		if (/GitHub 409/.test(msg)) throw new Error("GitHub reported a merge conflict with " + base + ". Resolve it on the branch " + job.review_branch + ".");
		throw new Error(`GitHub merge failed: ${msg.slice(0, 200)}`);
	}
	await ghFetch(`/repos/${sel.owner}/${sel.name}/git/refs/heads/${job.review_branch}`, conn.access_token, { method: "DELETE" }).catch(() => {});
	await context.supabase.from("coding_jobs").update({
		status: "completed",
		commit_sha: merged,
		review_branch: null,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", job.id);
	return {
		ok: true,
		sha: merged,
		base
	};
});
var discardJob_createServerFn_handler = createServerRpc({
	id: "84414820f38145d46d0817d5ecdd9567dfcef88237251d9b3498becd3535eefb",
	name: "discardJob",
	filename: "src/lib/jobs.functions.ts"
}, (opts) => discardJob.__executeServer(opts));
var discardJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(discardJob_createServerFn_handler, async ({ context, data }) => {
	const { data: job, error } = await context.supabase.from("coding_jobs").select("id, review_branch, repo_selection_id").eq("id", data.id).single();
	if (error) throw error;
	const { data: sel } = await context.supabase.from("repo_selections").select("owner, name").eq("id", job.repo_selection_id).single();
	const { data: conn } = await context.supabase.from("github_connections").select("access_token").maybeSingle();
	if (job.review_branch && sel && conn?.access_token) await ghFetch(`/repos/${sel.owner}/${sel.name}/git/refs/heads/${job.review_branch}`, conn.access_token, { method: "DELETE" }).catch(() => {});
	await context.supabase.from("coding_jobs").update({
		status: "discarded",
		review_branch: null,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", job.id);
	return { ok: true };
});
var listJobsForThread_createServerFn_handler = createServerRpc({
	id: "ae88e471ba0555f9a707a0c7ca719d83edb88cc0e440cc622590141b52c8d806",
	name: "listJobsForThread",
	filename: "src/lib/jobs.functions.ts"
}, (opts) => listJobsForThread.__executeServer(opts));
var listJobsForThread = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({ threadId: stringType().uuid() }).parse(i)).handler(listJobsForThread_createServerFn_handler, async ({ context, data }) => {
	const { data: rows, error } = await context.supabase.from("coding_jobs").select("id, status, prompt, task_id, commit_sha, error, finished_at, created_at").eq("thread_id", data.threadId).order("created_at", { ascending: false });
	if (error) throw error;
	return rows ?? [];
});
var cancelJob_createServerFn_handler = createServerRpc({
	id: "9e68af82cd2a1c15199838803e19d0ecc2492b63dfb855608f5f90105b675297",
	name: "cancelJob",
	filename: "src/lib/jobs.functions.ts"
}, (opts) => cancelJob.__executeServer(opts));
var cancelJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({ id: stringType().uuid() }).parse(i)).handler(cancelJob_createServerFn_handler, async ({ context, data }) => {
	await context.supabase.from("coding_jobs").update({
		status: "failed",
		error: "cancelled by user",
		finished_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", data.id).in("status", ["queued", "running"]);
	return { ok: true };
});
var enqueueIndexJob_createServerFn_handler = createServerRpc({
	id: "dd67ab5bee4120ce2012572bc63c6585809acd1e78477f376662c6e59638ecc9",
	name: "enqueueIndexJob",
	filename: "src/lib/jobs.functions.ts"
}, (opts) => enqueueIndexJob.__executeServer(opts));
var enqueueIndexJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({
	repoId: stringType().uuid(),
	model: stringType().min(1).max(200)
}).parse(i)).handler(enqueueIndexJob_createServerFn_handler, async ({ context, data }) => {
	const { data: repo, error: re } = await context.supabase.from("repo_selections").select("id, owner, name, working_branch, workflow_installed_at").eq("id", data.repoId).single();
	if (re) throw re;
	if (!repo.workflow_installed_at) throw new Error("Install the coder workflow for this repo first");
	const { data: or } = await context.supabase.from("openrouter_settings").select("api_key, mistral_api_key, groq_api_key, nvidia_api_key, embedding_provider").maybeSingle();
	if (!or) throw new Error("Add an AI provider key on the Account tab first");
	const provider = data.model.startsWith("mistral:") ? "mistral" : data.model.startsWith("groq:") ? "groq" : data.model.startsWith("nvidia:") ? "nvidia" : "openrouter";
	const chatKey = provider === "mistral" ? or.mistral_api_key : provider === "groq" ? or.groq_api_key : provider === "nvidia" ? or.nvidia_api_key : or.api_key;
	const embeddingKey = or.embedding_provider === "mistral" ? or.mistral_api_key : or.embedding_provider === "nvidia" ? or.nvidia_api_key : or.api_key;
	if (!chatKey) throw new Error(`Add your ${provider} API key first`);
	if (!embeddingKey) throw new Error(`Add your ${or.embedding_provider} API key for repository embeddings`);
	const { data: conn } = await context.supabase.from("github_connections").select("access_token").maybeSingle();
	if (!conn) throw new Error("Connect GitHub");
	const secret = crypto.randomUUID() + crypto.randomUUID();
	const requestUrl = new URL(getRequest().url);
	const appUrl = `${requestUrl.protocol}//${requestUrl.host}`;
	const { data: job, error: je } = await context.supabase.from("coding_jobs").insert({
		user_id: context.userId,
		thread_id: null,
		repo_selection_id: repo.id,
		status: "queued",
		prompt: "Index repository",
		model: data.model,
		job_type: "index",
		hmac_secret: secret,
		working_branch: repo.working_branch,
		logs: ""
	}).select().single();
	if (je) throw je;
	try {
		await ghFetch(`/repos/${repo.owner}/${repo.name}/dispatches`, conn.access_token, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				event_type: "lovable-coding-job",
				client_payload: {
					job_id: job.id,
					job_secret: secret,
					app_url: appUrl,
					working_branch: repo.working_branch
				}
			})
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		await context.supabase.from("coding_jobs").update({
			status: "failed",
			error: `dispatch: ${msg.slice(0, 400)}`
		}).eq("id", job.id);
		throw new Error(`GitHub dispatch failed: ${msg.slice(0, 200)}`);
	}
	return { jobId: job.id };
});
var getLatestIndexJob_createServerFn_handler = createServerRpc({
	id: "cb2d0481864d2f68e1c998e8688fc35ed55f354828ad77387cad45d70248a1d1",
	name: "getLatestIndexJob",
	filename: "src/lib/jobs.functions.ts"
}, (opts) => getLatestIndexJob.__executeServer(opts));
var getLatestIndexJob = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({ repoId: stringType().uuid() }).parse(i)).handler(getLatestIndexJob_createServerFn_handler, async ({ context, data }) => {
	const { data: row } = await context.supabase.from("coding_jobs").select("id, status, progress_current, progress_total, error, finished_at, created_at").eq("repo_selection_id", data.repoId).eq("job_type", "index").order("created_at", { ascending: false }).limit(1).maybeSingle();
	return row;
});
//#endregion
export { approveJob_createServerFn_handler, cancelJob_createServerFn_handler, discardJob_createServerFn_handler, enqueueCodingJob_createServerFn_handler, enqueueIndexJob_createServerFn_handler, getJobDiff_createServerFn_handler, getJob_createServerFn_handler, getLatestIndexJob_createServerFn_handler, installCoderWorkflow_createServerFn_handler, listJobsForThread_createServerFn_handler };
