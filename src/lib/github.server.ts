// GitHub REST + Git Data API helpers. Server-only.

const API = "https://api.github.com";

export function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "coderbot-app",
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch a GitHub REST endpoint with a request timeout and automatic retries for
 * transient failures (network errors, 408, 429, 5xx). GitHub's API is called
 * from the user-facing enqueue/commit flow, so a single dropped connection used
 * to surface as a raw "network request error" and abort the whole edit. Retries
 * only happen for failures where the request did not take effect (the request
 * threw, timed out, or returned a retryable status), so non-idempotent writes
 * are not duplicated on success.
 */
export async function ghFetch<T = unknown>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API}${path}`;
  const headers = { ...ghHeaders(token), ...(init.headers as Record<string, string> | undefined) };
  // Some completion/merge calls take a while on large repos; give them room
  // while still bounding a stuck connection so the request does not hang.
  const timeoutMs = init.method && init.method !== "GET" ? 60_000 : 30_000;
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) {
        // 204 No Content (e.g. a no-op merge) has an empty body.
        if (res.status === 204) return null as T;
        if (Number(res.headers.get("content-length") ?? 0) === 0) return null as T;
        return (await res.json()) as T;
      }
      const text = await res.text();
      // Retry transient responses; everything else is a real API error.
      if (res.status === 408 || res.status === 429 || res.status >= 500) {
        lastError = new Error(`GitHub ${res.status}: ${text.slice(0, 300)}`);
      } else {
        throw new Error(`GitHub ${res.status}: ${text.slice(0, 300)}`);
      }
    } catch (e) {
      // A thrown error (network/timeout/abort) is the retryable case. A
      // non-retryable status was re-thrown above and never reaches here.
      lastError = e instanceof Error ? e : new Error(String(e));
    }
    if (attempt < 3) await sleep(750 * 2 ** attempt + Math.floor(Math.random() * 250));
  }
  throw lastError instanceof Error ? lastError : new Error("GitHub request failed after retries");
}

export interface GhRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: { login: string; avatar_url: string };
  default_branch: string;
  description: string | null;
  updated_at: string;
  html_url: string;
}

export async function listAllRepos(token: string): Promise<GhRepo[]> {
  const all: GhRepo[] = [];
  for (let page = 1; page <= 5; page++) {
    const rows = await ghFetch<GhRepo[]>(
      `/user/repos?per_page=100&sort=updated&page=${page}&affiliation=owner,collaborator`,
      token,
    );
    all.push(...rows);
    if (rows.length < 100) break;
  }
  return all;
}

const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", ".turbo", ".cache",
  ".vercel", ".netlify", "coverage", ".pnpm-store", "target", "vendor",
]);
const SKIP_EXT = new Set([
  "png","jpg","jpeg","gif","webp","ico","svg","bmp","tiff","pdf",
  "zip","tar","gz","bz2","7z","rar","exe","dll","so","dylib","bin",
  "mp3","mp4","mov","avi","wav","flac","ogg","woff","woff2","ttf","otf","eot",
  "class","o","a","node","wasm",
]);
const MAX_BYTES = 300 * 1024;
const MAX_FILES = 400;

function shouldSkipPath(path: string): boolean {
  const parts = path.split("/");
  if (parts.some((p) => SKIP_DIRS.has(p))) return true;
  const ext = parts[parts.length - 1].split(".").pop()?.toLowerCase() ?? "";
  if (SKIP_EXT.has(ext)) return true;
  return false;
}

interface TreeItem { path: string; type: string; sha: string; size?: number }

export async function pullRepoFiles(
  owner: string,
  name: string,
  branch: string,
  token: string,
): Promise<Array<{ path: string; content: string; sha: string }>> {
  const ref = await ghFetch<{ object: { sha: string } }>(
    `/repos/${owner}/${name}/git/refs/heads/${encodeURIComponent(branch)}`,
    token,
  );
  const commit = await ghFetch<{ tree: { sha: string } }>(
    `/repos/${owner}/${name}/git/commits/${ref.object.sha}`,
    token,
  );
  const tree = await ghFetch<{ tree: TreeItem[]; truncated: boolean }>(
    `/repos/${owner}/${name}/git/trees/${commit.tree.sha}?recursive=1`,
    token,
  );

  const blobs = tree.tree.filter(
    (t) => t.type === "blob" && !shouldSkipPath(t.path) && (t.size ?? 0) < MAX_BYTES,
  ).slice(0, MAX_FILES);

  const out: Array<{ path: string; content: string; sha: string }> = [];
  const CONCURRENCY = 8;
  let i = 0;
  async function worker() {
    while (i < blobs.length) {
      const idx = i++;
      const b = blobs[idx];
      try {
        const blob = await ghFetch<{ content: string; encoding: string }>(
          `/repos/${owner}/${name}/git/blobs/${b.sha}`,
          token,
        );
        if (blob.encoding !== "base64") continue;
        const buf = Buffer.from(blob.content, "base64");
        // skip if the file looks binary (null byte in first KB)
        const probe = buf.subarray(0, 1024);
        if (probe.includes(0)) continue;
        out.push({ path: b.path, content: buf.toString("utf8"), sha: b.sha });
      } catch (e) {
        console.warn("pull failed", b.path, e);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return out;
}

export async function commitChanges(
  owner: string,
  name: string,
  branch: string,
  token: string,
  changes: Array<{ path: string; content: string | null }>,
  message: string,
): Promise<{ sha: string }> {
  // Get current head
  const ref = await ghFetch<{ object: { sha: string } }>(
    `/repos/${owner}/${name}/git/refs/heads/${encodeURIComponent(branch)}`,
    token,
  );
  const parentSha = ref.object.sha;
  const parentCommit = await ghFetch<{ tree: { sha: string } }>(
    `/repos/${owner}/${name}/git/commits/${parentSha}`,
    token,
  );

  // Create blobs for additions/modifications. Blobs are independent, so push
  // them in parallel instead of one-by-one when there are several changes.
  const treeEntries: Array<{ path: string; mode: "100644"; type: "blob"; sha: string | null }> = [];
  await Promise.all(changes.map(async (change, index) => {
    if (change.content === null) {
      // deletion: sha=null
      treeEntries[index] = { path: change.path, mode: "100644", type: "blob", sha: null };
      return;
    }
    const blob = await ghFetch<{ sha: string }>(
      `/repos/${owner}/${name}/git/blobs`,
      token,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: Buffer.from(change.content, "utf8").toString("base64"),
          encoding: "base64",
        }),
      },
    );
    treeEntries[index] = { path: change.path, mode: "100644", type: "blob", sha: blob.sha };
  }));

  const newTree = await ghFetch<{ sha: string }>(
    `/repos/${owner}/${name}/git/trees`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree: treeEntries }),
    },
  );

  const newCommit = await ghFetch<{ sha: string }>(
    `/repos/${owner}/${name}/git/commits`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        tree: newTree.sha,
        parents: [parentSha],
      }),
    },
  );

  await ghFetch(
    `/repos/${owner}/${name}/git/refs/heads/${encodeURIComponent(branch)}`,
    token,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sha: newCommit.sha }),
    },
  );

  return { sha: newCommit.sha };
}