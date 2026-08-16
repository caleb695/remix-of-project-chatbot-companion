// Server-only agent tools that operate on the in-app working copy (working_files).
// Nothing here touches GitHub — changes stay staged until the user commits.
import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

type Sb = SupabaseClient<any, any, any>;

export interface ToolCtx {
  sb: Sb;
  userId: string;
  repoId: string;
}

const MAX_READ = 40_000;
const MAX_BATCH_READ = 5; // Max files for batch operations

async function findReferenceRepo(sb: Sb, userId: string, repo: string) {
  const [owner, name] = repo.split("/");
  if (!owner || !name) return { error: "Use repo as owner/name" } as const;
  const { data, error } = await sb
    .from("repo_selections")
    .select("id, owner, name")
    .eq("user_id", userId)
    .eq("owner", owner)
    .eq("name", name)
    .maybeSingle();
  if (error) return { error: error.message } as const;
  if (!data) return { error: `Reference repo not found or not connected: ${repo}` } as const;
  return { repo: data } as const;
}

/* ---- Web search helpers (DuckDuckGo HTML with Bing fallback, no API key) ---- */
function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;|&#47;/g, "/")
    .replace(/&#x3D;/g, "=")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDuckResults(html: string, limit: number): string[] {
  const out: string[] = [];
  const linkRe = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snipRe = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  const links: Array<{ url: string; title: string }> = [];
  const snips: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html))) {
    let url = m[1] || "";
    url = url.replace(/^\/\/duckduckgo\.com\/l\/\?uddg=/, "").split("&rut=")[0];
    try { url = decodeURIComponent(url); } catch { /* keep raw */ }
    links.push({ url, title: stripHtml(m[2]) });
  }
  while ((m = snipRe.exec(html))) snips.push(stripHtml(m[1]));
  for (let i = 0; i < links.length && out.length < limit; i++) {
    if (!links[i].title) continue;
    out.push(`${i + 1}. ${links[i].title}\n   ${links[i].url}${snips[i] ? `\n   ${snips[i]}` : ""}`);
  }
  return out;
}

function parseBingResults(html: string, limit: number): string[] {
  const out: string[] = [];
  const cardRe = /<li class="b_algo"[\s\S]*?(?:<\/li>|<li class=")/g;
  const cards: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = cardRe.exec(html))) cards.push(m[0]);
  if (!cards.length) {
    const blockRe = /<h2[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/g;
    while ((m = blockRe.exec(html))) {
      out.push(`${out.length + 1}. ${stripHtml(m[2])}\n   ${m[1]}${m[3] ? `\n   ${stripHtml(m[3])}` : ""}`);
      if (out.length >= limit) break;
    }
    return out;
  }
  for (const c of cards) {
    const a = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(c);
    const p = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(c);
    if (!a || !stripHtml(a[2])) continue;
    out.push(`${out.length + 1}. ${stripHtml(a[2])}\n   ${a[1]}${p ? `\n   ${stripHtml(p[1])}` : ""}`);
    if (out.length >= limit) break;
  }
  return out;
}

function parseBingRssResults(html: string, limit: number): string[] {
  const items: string[] = [];
  const itemRe = /<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>[\s\S]*?<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>[\s\S]*?(?:<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>)?[\s\S]*?<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(html))) {
    items.push(`${items.length + 1}. ${stripHtml(m[1])}\n   ${m[2]}${m[3] ? `\n   ${stripHtml(m[3])}` : ""}`);
    if (items.length >= limit) break;
  }
  return items;
}

export async function webSearch(query: string, maxResults: number): Promise<string> {
  const q = String(query || "").trim();
  if (!q) return "search_web requires a ?query=";
  const limit = Math.min(Math.max(Math.floor(maxResults || 6), 1), 12);
  const agent = "Mozilla/5.0 (compatible; Coderbot/1.0)";
  for (const provider of ["duck", "bing"] as const) {
    try {
      const url = provider === "duck"
        ? "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q)
        : "https://www.bing.com/search?q=" + encodeURIComponent(q) + "&format=rss";
      const res = await fetch(url, { headers: { "User-Agent": agent }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const html = (await res.text()).replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
      const results = provider === "duck"
        ? parseDuckResults(html, limit)
        : /<item>/i.test(html)
          ? parseBingRssResults(html, limit)
          : parseBingResults(html, limit);
      if (results.length) return results.join("\n\n");
    } catch {
      /* try next provider */
    }
  }
  return `No results for "${q}".`;
}

// Cache for frequently accessed file lists (per-repo, short-lived)
const fileListCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds

export function buildAgentTools(ctx: ToolCtx, opts: { allowWrites: boolean }) {
  const { sb, userId, repoId } = ctx;

  const readOnly = {
    list_files: tool({
      description:
        "List files in the working copy of the repository. Optionally filter by a path prefix or glob-ish substring.",
      inputSchema: z.object({
        prefix: z.string().optional().describe("Only return paths containing this substring"),
        force_refresh: z.boolean().optional().describe("Skip cache and fetch fresh data"),
      }),
      execute: async ({ prefix, force_refresh }) => {
        const cacheKey = `files:${repoId}:${prefix || ""}`;
        const now = Date.now();
        const cached = fileListCache.get(cacheKey);
        
        // Use cache if valid and not forcing refresh
        if (!force_refresh && cached && (now - cached.timestamp) < CACHE_TTL_MS) {
          let rows = cached.data;
          if (prefix) rows = rows.filter((r) => r.path.includes(prefix));
          if (rows.length === 0) {
            return {
              files: [],
              note: "Working copy is empty. Ask the user to press Sync on the Account tab for this repo.",
              cached: true,
            };
          }
          return { count: rows.length, files: rows.slice(0, 600).map((r) => `${r.path}${r.status !== "unchanged" ? ` (${r.status})` : ""}`), cached: true };
        }
        
        const { data, error } = await sb
          .from("working_files")
          .select("path, status")
          .eq("repo_selection_id", repoId)
          .neq("status", "deleted")
          .order("path");
        if (error) return { error: error.message };
        let rows = data ?? [];
        
        // Update cache
        fileListCache.set(cacheKey, { data: rows, timestamp: now });
        
        if (rows.length === 0) {
          return {
            files: [],
            note: "Working copy is empty. Ask the user to press Sync on the Account tab for this repo.",
          };
        }
        return { count: rows.length, files: rows.slice(0, 600).map((r) => `${r.path}${r.status !== "unchanged" ? ` (${r.status})` : ""}`) };
      },
    }),

    read_file: tool({
      description: "Read the full contents of a file from the working copy.",
      inputSchema: z.object({ path: z.string() }),
      execute: async ({ path }) => {
        const { data, error } = await sb
          .from("working_files")
          .select("content, status")
          .eq("repo_selection_id", repoId)
          .eq("path", path)
          .maybeSingle();
        if (error) return { error: error.message };
        if (!data || data.status === "deleted") return { error: `Not found: ${path}` };
        const content = data.content ?? "";
        return { path, content: content.slice(0, MAX_READ), truncated: content.length > MAX_READ };
      },
    }),

    batch_read_files: tool({
      description: "Read multiple files at once for efficiency. Returns an array of file contents. Use when you need to understand relationships between files or make cross-file changes.",
      inputSchema: z.object({ paths: z.array(z.string()).max(MAX_BATCH_READ) }),
      execute: async ({ paths }) => {
        const { data, error } = await sb
          .from("working_files")
          .select("path, content, status")
          .eq("repo_selection_id", repoId)
          .in("path", paths);
        if (error) return { error: error.message };
        const results: Array<{ path: string; content: string; truncated: boolean; error?: string }> = [];
        const foundPaths = new Set(data?.map(d => d.path) || []);
        for (const p of paths) {
          const row = data?.find(d => d.path === p);
          if (!row || row.status === "deleted") {
            results.push({ path: p, content: "", truncated: false, error: "Not found" });
          } else {
            const content = row.content ?? "";
            results.push({ path: p, content: content.slice(0, MAX_READ), truncated: content.length > MAX_READ });
          }
        }
        return { files: results, missing: paths.filter(p => !foundPaths.has(p)) };
      },
    }),

    search_code: tool({
      description:
        "Search the working copy for a literal string or regular expression. Returns matching files with line numbers.",
      inputSchema: z.object({
        query: z.string(),
        regex: z.boolean().optional(),
        max_results: z.number().optional(),
      }),
      execute: async ({ query, regex, max_results }) => {
        const { data, error } = await sb
          .from("working_files")
          .select("path, content")
          .eq("repo_selection_id", repoId)
          .neq("status", "deleted");
        if (error) return { error: error.message };
        let re: RegExp;
        try {
          re = regex ? new RegExp(query, "i") : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        } catch (e) {
          return { error: `Bad pattern: ${String(e)}` };
        }
        const limit = Math.min(max_results ?? 40, 120);
        const hits: Array<{ path: string; line: number; text: string }> = [];
        for (const f of data ?? []) {
          const lines = (f.content ?? "").split("\n");
          for (let i = 0; i < lines.length; i++) {
            if (re.test(lines[i])) {
              hits.push({ path: f.path, line: i + 1, text: lines[i].slice(0, 200).trim() });
              if (hits.length >= limit) break;
            }
          }
          if (hits.length >= limit) break;
        }
        return { count: hits.length, hits };
      },
    }),

    search_web: tool({
      description:
        "Search the web for a query and return titles, URLs and snippets of the top results. Use this to look up current docs, package versions, error fixes and best practices instead of guessing. Read-only.",
      inputSchema: z.object({
        query: z.string().describe("The search query"),
        max_results: z.number().optional().describe("Max results (default 6, max 12)"),
      }),
      execute: async ({ query, max_results }) => {
        return webSearch(query ?? "", max_results ?? 6);
      },
    }),

    fetch_url: tool({
      description: "Fetch the text content of a URL (e.g., documentation, API reference, RFC). Returns up to 50KB of content. Use this to read external resources needed for the code.",
      inputSchema: z.object({ url: z.string().describe("The URL to fetch") }),
      execute: async ({ url }) => {
        const u = String(url || "").trim();
        if (!u) return "fetch_url requires a ?url=";
        if (!/^https?:\/\//i.test(u)) return "URL must start with http:// or https://";
        try {
          const res = await fetch(u, { 
            headers: { "User-Agent": "Mozilla/5.0 (compatible; Coderbot/1.0)" }, 
            signal: AbortSignal.timeout(15000) 
          });
          if (!res.ok) return `HTTP ${res.status}`;
          const text = await res.text();
          return text.slice(0, 50_000) + (text.length > 50_000 ? "\n\n[...truncated]" : "");
        } catch (e) {
          return `Fetch failed: ${String(e)}`;
        }
      },
    }),

    list_reference_repos: tool({
      description:
        "List other GitHub repos this user connected. Use these read-only reference repos to borrow patterns or copy any relevant code snippets into the repo you are editing.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await sb
          .from("repo_selections")
          .select("owner, name, indexed_at")
          .eq("user_id", userId)
          .neq("id", repoId)
          .order("owner");
        if (error) return { error: error.message };
        return { repos: (data ?? []).map((r) => `${r.owner}/${r.name}${r.indexed_at ? "" : " (not indexed/synced yet)"}`) };
      },
    }),

    list_reference_files: tool({
      description: "List files in a connected reference repo by owner/name. Read-only; cannot edit that repo.",
      inputSchema: z.object({ repo: z.string().describe("owner/name"), prefix: z.string().optional() }),
      execute: async ({ repo, prefix }) => {
        const found = await findReferenceRepo(sb, userId, repo);
        if ("error" in found) return { error: found.error };
        const { data, error } = await sb
          .from("working_files")
          .select("path")
          .eq("repo_selection_id", found.repo.id)
          .neq("status", "deleted")
          .order("path");
        if (error) return { error: error.message };
        let rows = data ?? [];
        if (prefix) rows = rows.filter((r) => r.path.includes(prefix));
        return { repo, count: rows.length, files: rows.slice(0, 600).map((r) => r.path) };
      },
    }),

    read_reference_file: tool({
      description: "Read a file from a connected reference repo by owner/name so you can copy any useful part into the repo you are editing.",
      inputSchema: z.object({ repo: z.string().describe("owner/name"), path: z.string() }),
      execute: async ({ repo, path }) => {
        const found = await findReferenceRepo(sb, userId, repo);
        if ("error" in found) return { error: found.error };
        const { data, error } = await sb
          .from("working_files")
          .select("content, status")
          .eq("repo_selection_id", found.repo.id)
          .eq("path", path)
          .maybeSingle();
        if (error) return { error: error.message };
        if (!data || data.status === "deleted") return { error: `Not found in ${repo}: ${path}` };
        const content = data.content ?? "";
        return { repo, path, content: content.slice(0, MAX_READ), truncated: content.length > MAX_READ };
      },
    }),

    search_reference_code: tool({
      description: "Search a connected reference repo for code to reuse. Returns matching files with line numbers. Read-only.",
      inputSchema: z.object({ repo: z.string().describe("owner/name"), query: z.string(), regex: z.boolean().optional(), max_results: z.number().optional() }),
      execute: async ({ repo, query, regex, max_results }) => {
        const found = await findReferenceRepo(sb, userId, repo);
        if ("error" in found) return { error: found.error };
        const { data, error } = await sb
          .from("working_files")
          .select("path, content")
          .eq("repo_selection_id", found.repo.id)
          .neq("status", "deleted");
        if (error) return { error: error.message };
        let re: RegExp;
        try {
          re = regex ? new RegExp(query, "i") : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        } catch (e) {
          return { error: `Bad pattern: ${String(e)}` };
        }
        const limit = Math.min(max_results ?? 40, 120);
        const hits: Array<{ path: string; line: number; text: string }> = [];
        for (const f of data ?? []) {
          const lines = (f.content ?? "").split("\n");
          for (let i = 0; i < lines.length; i++) {
            if (re.test(lines[i])) {
              hits.push({ path: f.path, line: i + 1, text: lines[i].slice(0, 200).trim() });
              if (hits.length >= limit) break;
            }
          }
          if (hits.length >= limit) break;
        }
        return { repo, count: hits.length, hits };
      },
    }),

    check_code: tool({
      description:
        "Static review of the files you changed in this task. Reports real, likely problems: unbalanced brackets, leftover merge-conflict markers, imports of local files that do not exist, TODO/FIXME left behind, and empty files. Call this after editing, then fix anything it reports and call it again until clean.",
      inputSchema: z.object({
        paths: z.array(z.string()).optional().describe("Restrict the check to these paths"),
      }),
      execute: async ({ paths }) => {
        const q = sb
          .from("working_files")
          .select("path, content, status")
          .eq("repo_selection_id", repoId)
          .neq("status", "unchanged");
        const { data, error } = await q;
        if (error) return { error: error.message };
        let files = (data ?? []).filter((f) => f.status !== "deleted");
        if (paths?.length) files = files.filter((f) => paths.includes(f.path));
        if (files.length === 0) return { problems: [], note: "No staged changes to check." };

        const { data: allRows } = await sb
          .from("working_files")
          .select("path")
          .eq("repo_selection_id", repoId)
          .neq("status", "deleted");
        const existing = new Set((allRows ?? []).map((r) => r.path));

        const problems: Array<{ path: string; issue: string; severity: "error" | "warning" | "info"; suggestion?: string }> = [];
        const suggestions: Array<{ path: string; type: string; message: string }> = [];
        
        for (const f of files) {
          const content = f.content ?? "";
          if (!content.trim()) {
            problems.push({ path: f.path, issue: "File is empty", severity: "warning" });
            continue;
          }
          if (/^<{7}|^>{7}|^={7}$/m.test(content)) {
            problems.push({ path: f.path, issue: "Leftover merge conflict markers", severity: "error" });
          }
          const code = stripLiterals(content);
          for (const [open, close, label] of [["{", "}", "braces"], ["(", ")", "parens"], ["[", "]", "brackets"]] as const) {
            const o = code.split(open).length - 1;
            const c = code.split(close).length - 1;
            if (o !== c) problems.push({ path: f.path, issue: `Unbalanced ${label} (${o} vs ${c})`, severity: "error" });
          }
          if (/\b(TODO|FIXME)\b/.test(content)) {
            problems.push({ path: f.path, issue: "Contains TODO/FIXME left in the code", severity: "warning" });
          }
          const importRe = /(?:from|require\()\s*['"](\.[^'"]+)['"]/g;
          let m: RegExpExecArray | null;
          while ((m = importRe.exec(content))) {
            const spec = m[1];
            const base = resolveRelative(f.path, spec);
            const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.mjs`,
              `${base}/index.ts`, `${base}/index.tsx`, `${base}/index.js`, `${base}.py`, `${base}.css`, `${base}.json`];
            if (!candidates.some((c) => existing.has(c))) {
              problems.push({ path: f.path, issue: `Imports missing local file: ${spec}`, severity: "error" });
            }
          }
          // Check for common syntax issues
          if (/\b(async)\s+(?!\()/i.test(content) && !/\bawait\b/.test(content)) {
            problems.push({ path: f.path, issue: "async function without await - might be unnecessary", severity: "warning" });
          }
          if (/console\.log\s*\(/i.test(content)) {
            problems.push({ path: f.path, issue: "Contains console.log - consider removing before commit", severity: "warning" });
          }
          
          // NEW: Detect missing package imports (external dependencies)
          const externalImports = content.match(/(?:from|require\(['"])([a-zA-Z@][^'"]*)['"]/g) || [];
          const knownBuiltins = new Set(["fs", "path", "http", "https", "os", "crypto", "stream", "events", "util", "child_process", "cluster", "dns", "net", "readline", "tls", "zlib", "assert", "buffer", "querystring", "url", "vm"]);
          for (const imp of externalImports) {
            const pkg = imp.replace(/^(?:from|require\(['"])([a-zA-Z@][^'"]*)['"].*/, "$1").split("/")[0];
            if (!knownBuiltins.has(pkg) && !pkg.startsWith(".")) {
              suggestions.push({ path: f.path, type: "dependency", message: `Uses external package '${pkg}' - ensure it's in package.json` });
            }
          }
          
          // NEW: Detect potential performance issues
          if (/\bforEach\s*\([^)]*\)\s*\{[^}]*\bawait\b/.test(content)) {
            suggestions.push({ path: f.path, type: "performance", message: "Using await inside forEach - consider Promise.all or for...of for better performance" });
          }
          if (/\bJSON\.parse\s*\(\s*JSON\.stringify\s*\(/.test(content)) {
            suggestions.push({ path: f.path, type: "performance", message: "Deep cloning with JSON.parse/stringify - consider structuredClone() for better performance" });
          }
        }
        return { checked: files.map((f) => f.path), problems, suggestions, clean: problems.length === 0 };
      },
    }),
  };

  if (!opts.allowWrites) return readOnly;

  return {
    ...readOnly,
    write_file: tool({
      description:
        "Create or overwrite a file in the working copy. Always pass the COMPLETE new file contents. Staged only — not pushed to GitHub until the user commits.",
      inputSchema: z.object({ path: z.string(), content: z.string() }),
      execute: async ({ path, content }) => {
        const { data: existing } = await sb
          .from("working_files")
          .select("id, original_content")
          .eq("repo_selection_id", repoId)
          .eq("path", path)
          .maybeSingle();
        if (existing) {
          const { error } = await sb
            .from("working_files")
            .update({ content, status: "modified", updated_at: new Date().toISOString() })
            .eq("id", existing.id);
          if (error) return { error: error.message };
          return { ok: true, path, action: "modified", bytes: content.length };
        }
        const { error } = await sb.from("working_files").insert({
          repo_selection_id: repoId,
          user_id: userId,
          path,
          content,
          original_content: null,
          status: "added",
        });
        if (error) return { error: error.message };
        return { ok: true, path, action: "added", bytes: content.length };
      },
    }),

    edit_file: tool({
      description:
        "Replace an exact substring in an existing file. Use for small targeted edits instead of rewriting the whole file.",
      inputSchema: z.object({
        path: z.string(),
        find: z.string(),
        replace: z.string(),
        replace_all: z.boolean().optional(),
      }),
      execute: async ({ path, find, replace, replace_all }) => {
        const { data: row } = await sb
          .from("working_files")
          .select("id, content")
          .eq("repo_selection_id", repoId)
          .eq("path", path)
          .maybeSingle();
        if (!row) return { error: `Not found: ${path}` };
        const content = row.content ?? "";
        if (!content.includes(find)) return { error: "The `find` text does not appear in the file. Read it again." };
        const next = replace_all ? content.split(find).join(replace) : content.replace(find, replace);
        const { error } = await sb
          .from("working_files")
          .update({ content: next, status: "modified", updated_at: new Date().toISOString() })
          .eq("id", row.id);
        if (error) return { error: error.message };
        return { ok: true, path, action: "edited" };
      },
    }),

    batch_edit_files: tool({
      description: "Apply the same find/replace edit across multiple files at once. Use when you need to make the same change in several files (e.g., renaming a function, updating imports). More efficient than calling edit_file repeatedly.",
      inputSchema: z.object({
        paths: z.array(z.string()).max(10),
        find: z.string(),
        replace: z.string(),
        replace_all: z.boolean().optional(),
      }),
      execute: async ({ paths, find, replace, replace_all }) => {
        const results: Array<{ path: string; success: boolean; error?: string }> = [];
        for (const path of paths) {
          const { data: row } = await sb
            .from("working_files")
            .select("id, content")
            .eq("repo_selection_id", repoId)
            .eq("path", path)
            .maybeSingle();
          if (!row) {
            results.push({ path, success: false, error: "Not found" });
            continue;
          }
          const content = row.content ?? "";
          if (!content.includes(find)) {
            results.push({ path, success: false, error: "Find text not in file" });
            continue;
          }
          const next = replace_all ? content.split(find).join(replace) : content.replace(find, replace);
          const { error } = await sb
            .from("working_files")
            .update({ content: next, status: "modified", updated_at: new Date().toISOString() })
            .eq("id", row.id);
          if (error) {
            results.push({ path, success: false, error: error.message });
          } else {
            results.push({ path, success: true });
          }
        }
        const succeeded = results.filter(r => r.success).length;
        return { total: paths.length, succeeded, failed: paths.length - succeeded, results };
      },
    }),

    delete_file: tool({
      description: "Mark a file as deleted in the working copy.",
      inputSchema: z.object({ path: z.string() }),
      execute: async ({ path }) => {
        const { data: row } = await sb
          .from("working_files")
          .select("id, status")
          .eq("repo_selection_id", repoId)
          .eq("path", path)
          .maybeSingle();
        if (!row) return { error: `Not found: ${path}` };
        const { error } = await sb
          .from("working_files")
          .update({ status: "deleted", updated_at: new Date().toISOString() })
          .eq("id", row.id);
        if (error) return { error: error.message };
        return { ok: true, path, action: "deleted" };
      },
    }),

    staged_changes: tool({
      description: "List every file currently staged for commit, with its status.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data } = await sb
          .from("working_files")
          .select("path, status")
          .eq("repo_selection_id", repoId)
          .neq("status", "unchanged")
          .order("path");
        return { count: data?.length ?? 0, changes: data ?? [] };
      },
    }),
  };
}

function resolveRelative(fromPath: string, spec: string): string {
  const dir = fromPath.split("/").slice(0, -1);
  const parts = spec.split("/");
  const out = [...dir];
  for (const p of parts) {
    if (p === "." || p === "") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return out.join("/");
}

/* Blank out string literals, template literals, regex literals, line comments
 * and block comments so bracket/paren balance checks count real code only.
 * Without this, `(`/`)`/`{`/`}` inside strings and regexes (which are not
 * supposed to balance — e.g. `require\(` or a `"("`) produce false positives. */
function stripLiterals(src: string): string {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    // Line comment
    if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") { out += " "; i++; }
      continue;
    }
    // Block comment
    if (c === "/" && src[i + 1] === "*") {
      out += "  ";
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) { out += " "; i++; }
      if (i < n) { out += "  "; i += 2; }
      continue;
    }
    // String / template / char literal
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      out += " ";
      i++;
      while (i < n) {
        if (src[i] === "\\") { out += "  "; i += 2; continue; }
        if (src[i] === q) { out += " "; i++; break; }
        out += " ";
        i++;
      }
      continue;
    }
    // Regex literal (heuristic: /.../ not following an identifier/quote and not // or /*)
    if (c === "/") {
      let j = i + 1;
      let isRegex = false;
      let inClass = false;
      for (; j < n; j++) {
        if (src[j] === "\\") { j++; continue; }
        if (src[j] === "[") inClass = true;
        if (src[j] === "]") inClass = false;
        if (src[j] === "/" && !inClass) { isRegex = true; break; }
        if (src[j] === "\n") break;
      }
      if (isRegex) {
        out += " ";
        i = j + 1;
        while (i < n && /[a-z]/i.test(src[i])) { out += " "; i++; }
        continue;
      }
    }
    out += c;
    i++;
  }
  return out;
}
