import { Buffer } from "node:buffer";
//#region node_modules/.nitro/vite/services/ssr/assets/github.server-liDhNs7u.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var github_server_exports = /* @__PURE__ */ __exportAll({
	commitChanges: () => commitChanges,
	ghFetch: () => ghFetch,
	ghHeaders: () => ghHeaders,
	listAllRepos: () => listAllRepos,
	pullRepoFiles: () => pullRepoFiles
});
var API = "https://api.github.com";
function ghHeaders(token) {
	return {
		Authorization: `Bearer ${token}`,
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
		"User-Agent": "coderbot-app"
	};
}
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/**
* Fetch a GitHub REST endpoint with a request timeout and automatic retries for
* transient failures (network errors, 408, 429, 5xx). GitHub's API is called
* from the user-facing enqueue/commit flow, so a single dropped connection used
* to surface as a raw "network request error" and abort the whole edit. Retries
* only happen for failures where the request did not take effect (the request
* threw, timed out, or returned a retryable status), so non-idempotent writes
* are not duplicated on success.
*/
async function ghFetch(path, token, init = {}) {
	const url = path.startsWith("http") ? path : `${API}${path}`;
	const headers = {
		...ghHeaders(token),
		...init.headers
	};
	const timeoutMs = init.method && init.method !== "GET" ? 6e4 : 3e4;
	let lastError;
	for (let attempt = 0; attempt < 4; attempt++) {
		try {
			const res = await fetch(url, {
				...init,
				headers,
				signal: AbortSignal.timeout(timeoutMs)
			});
			if (res.ok) {
				if (res.status === 204) return null;
				if (Number(res.headers.get("content-length") ?? 0) === 0) return null;
				return await res.json();
			}
			const text = await res.text();
			if (res.status === 408 || res.status === 429 || res.status >= 500) lastError = /* @__PURE__ */ new Error(`GitHub ${res.status}: ${text.slice(0, 300)}`);
			else throw new Error(`GitHub ${res.status}: ${text.slice(0, 300)}`);
		} catch (e) {
			lastError = e instanceof Error ? e : new Error(String(e));
		}
		if (attempt < 3) await sleep(750 * 2 ** attempt + Math.floor(Math.random() * 250));
	}
	throw lastError instanceof Error ? lastError : /* @__PURE__ */ new Error("GitHub request failed after retries");
}
async function listAllRepos(token) {
	const all = [];
	for (let page = 1; page <= 5; page++) {
		const rows = await ghFetch(`/user/repos?per_page=100&sort=updated&page=${page}&affiliation=owner,collaborator`, token);
		all.push(...rows);
		if (rows.length < 100) break;
	}
	return all;
}
var SKIP_DIRS = /* @__PURE__ */ new Set([
	"node_modules",
	".git",
	".next",
	"dist",
	"build",
	".turbo",
	".cache",
	".vercel",
	".netlify",
	"coverage",
	".pnpm-store",
	"target",
	"vendor"
]);
var SKIP_EXT = /* @__PURE__ */ new Set([
	"png",
	"jpg",
	"jpeg",
	"gif",
	"webp",
	"ico",
	"svg",
	"bmp",
	"tiff",
	"pdf",
	"zip",
	"tar",
	"gz",
	"bz2",
	"7z",
	"rar",
	"exe",
	"dll",
	"so",
	"dylib",
	"bin",
	"mp3",
	"mp4",
	"mov",
	"avi",
	"wav",
	"flac",
	"ogg",
	"woff",
	"woff2",
	"ttf",
	"otf",
	"eot",
	"class",
	"o",
	"a",
	"node",
	"wasm"
]);
var MAX_BYTES = 300 * 1024;
var MAX_FILES = 400;
function shouldSkipPath(path) {
	const parts = path.split("/");
	if (parts.some((p) => SKIP_DIRS.has(p))) return true;
	const ext = parts[parts.length - 1].split(".").pop()?.toLowerCase() ?? "";
	if (SKIP_EXT.has(ext)) return true;
	return false;
}
async function pullRepoFiles(owner, name, branch, token) {
	const blobs = (await ghFetch(`/repos/${owner}/${name}/git/trees/${(await ghFetch(`/repos/${owner}/${name}/git/commits/${(await ghFetch(`/repos/${owner}/${name}/git/refs/heads/${encodeURIComponent(branch)}`, token)).object.sha}`, token)).tree.sha}?recursive=1`, token)).tree.filter((t) => t.type === "blob" && !shouldSkipPath(t.path) && (t.size ?? 0) < MAX_BYTES).slice(0, MAX_FILES);
	const out = [];
	const CONCURRENCY = 8;
	let i = 0;
	async function worker() {
		while (i < blobs.length) {
			const idx = i++;
			const b = blobs[idx];
			try {
				const blob = await ghFetch(`/repos/${owner}/${name}/git/blobs/${b.sha}`, token);
				if (blob.encoding !== "base64") continue;
				const buf = Buffer.from(blob.content, "base64");
				if (buf.subarray(0, 1024).includes(0)) continue;
				out.push({
					path: b.path,
					content: buf.toString("utf8"),
					sha: b.sha
				});
			} catch (e) {
				console.warn("pull failed", b.path, e);
			}
		}
	}
	await Promise.all(Array.from({ length: CONCURRENCY }, worker));
	return out;
}
async function commitChanges(owner, name, branch, token, changes, message) {
	const parentSha = (await ghFetch(`/repos/${owner}/${name}/git/refs/heads/${encodeURIComponent(branch)}`, token)).object.sha;
	const parentCommit = await ghFetch(`/repos/${owner}/${name}/git/commits/${parentSha}`, token);
	const treeEntries = [];
	await Promise.all(changes.map(async (change, index) => {
		if (change.content === null) {
			treeEntries[index] = {
				path: change.path,
				mode: "100644",
				type: "blob",
				sha: null
			};
			return;
		}
		const blob = await ghFetch(`/repos/${owner}/${name}/git/blobs`, token, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				content: Buffer.from(change.content, "utf8").toString("base64"),
				encoding: "base64"
			})
		});
		treeEntries[index] = {
			path: change.path,
			mode: "100644",
			type: "blob",
			sha: blob.sha
		};
	}));
	const newTree = await ghFetch(`/repos/${owner}/${name}/git/trees`, token, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			base_tree: parentCommit.tree.sha,
			tree: treeEntries
		})
	});
	const newCommit = await ghFetch(`/repos/${owner}/${name}/git/commits`, token, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			message,
			tree: newTree.sha,
			parents: [parentSha]
		})
	});
	await ghFetch(`/repos/${owner}/${name}/git/refs/heads/${encodeURIComponent(branch)}`, token, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ sha: newCommit.sha })
	});
	return { sha: newCommit.sha };
}
//#endregion
export { github_server_exports as n, ghFetch as t };
