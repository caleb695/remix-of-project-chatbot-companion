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

export async function ghFetch<T = unknown>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...ghHeaders(token), ...(init.headers as Record<string, string> | undefined) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
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

  // Create blobs for additions/modifications
  const treeEntries: Array<{ path: string; mode: "100644"; type: "blob"; sha: string | null }> = [];
  for (const change of changes) {
    if (change.content === null) {
      // deletion: sha=null
      treeEntries.push({ path: change.path, mode: "100644", type: "blob", sha: null });
    } else {
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
      treeEntries.push({ path: change.path, mode: "100644", type: "blob", sha: blob.sha });
    }
  }

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