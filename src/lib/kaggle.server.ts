// Server-only Kaggle API helpers + agent tools for notebook coding.
import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { webSearch } from "./agent-tools.server";

const API = "https://www.kaggle.com/api/v1";

/** Fetch a URL and return its text content (truncated to 50KB). */
async function fetchUrl(url: string): Promise<string> {
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
}

/**
 * Replace Python string literals and comments with spaces (preserving newlines
 * and length so line numbers and indentation are unchanged) before counting
 * brackets. Counting brackets on raw source miscounts brackets that appear
 * inside strings or comments (e.g. print(")") or # use a ( here) and reports
 * false "unbalanced" problems on perfectly valid code.
 */
function stripPythonLiterals(src: string): string {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    // Line comment
    if (c === "#") {
      while (i < n && src[i] !== "\n") { out += " "; i++; }
      continue;
    }
    // Triple-quoted string
    if ((c === '"' || c === "'") && src[i + 1] === c && src[i + 2] === c) {
      const q = c;
      out += "   ";
      i += 3;
      while (i < n) {
        if (src[i] === q && src[i + 1] === q && src[i + 2] === q) { out += "   "; i += 3; break; }
        out += src[i] === "\n" ? "\n" : " ";
        i++;
      }
      continue;
    }
    // Single/double-quoted string
    if (c === '"' || c === "'") {
      const q = c;
      out += " ";
      i++;
      while (i < n) {
        if (src[i] === "\\") { out += "  "; i += 2; continue; }
        if (src[i] === q) { out += " "; i++; break; }
        out += src[i] === "\n" ? "\n" : " ";
        i++;
      }
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

export function kaggleHeaders(username: string, key: string) {
  const basic = Buffer.from(`${username}:${key}`, "utf8").toString("base64");
  return {
    Authorization: `Basic ${basic}`,
    "Content-Type": "application/json",
    "User-Agent": "coderbot-app",
  };
}

async function kaggleFetch(
  username: string, key: string, path: string,
  init?: { method?: string; body?: unknown },
) {
  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? "GET",
    headers: kaggleHeaders(username, key),
    ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      res.status === 401 || res.status === 403
        ? "Kaggle rejected your credentials. Check your username and API key on the Account tab."
        : `Kaggle ${res.status}: ${text.slice(0, 300)}`,
    );
  }
  try { return JSON.parse(text); } catch { return text as unknown; }
}

export type KaggleKernel = { ref: string; title: string; lastRunTime?: string; isPrivate?: boolean };

export async function listKernels(username: string, key: string) {
  const rows = (await kaggleFetch(username, key,
    `/kernels/list?user=${encodeURIComponent(username)}&page_size=100&sort_by=dateRun`)) as KaggleKernel[];
  return Array.isArray(rows) ? rows : [];
}

export type KaggleBlob = {
  metadata?: {
    title?: string; language?: string; kernelType?: string; isPrivate?: boolean;
    enableGpu?: boolean; enableInternet?: boolean; datasetDataSources?: string[];
  };
  blob?: { source?: string; language?: string; kernelType?: string; slug?: string };
};

export async function pullKernel(username: string, key: string, owner: string, slug: string) {
  return (await kaggleFetch(username, key,
    `/kernels/pull?user_name=${encodeURIComponent(owner)}&kernel_slug=${encodeURIComponent(slug)}`)) as KaggleBlob;
}

export async function pushKernel(username: string, key: string, nb: {
  owner: string; slug: string; title: string; source: string; language: string;
  kernelType: string; isPrivate: boolean; enableGpu: boolean; enableInternet: boolean;
  datasetSources: string[];
}) {
  return await kaggleFetch(username, key, "/kernels/push", {
    method: "POST",
    body: {
      id: null,
      slug: `${nb.owner}/${nb.slug}`,
      newTitle: nb.title,
      text: nb.source,
      language: nb.language,
      kernelType: nb.kernelType,
      isPrivate: nb.isPrivate,
      enableGpu: nb.enableGpu,
      enableInternet: nb.enableInternet,
      datasetDataSources: nb.datasetSources,
      competitionDataSources: [],
      kernelDataSources: [],
      categoryIds: [],
    },
  });
}

/* ------------------------------------------------------------------ tools */

type Sb = SupabaseClient<any, any, any>;

/** Agent tools for a single Kaggle notebook (one source document + a checker). */
export function buildKaggleTools(
  ctx: { sb: Sb; notebookId: string },
  opts: { allowWrites: boolean },
) {
  const { sb, notebookId } = ctx;
  const load = async () => {
    const { data, error } = await sb.from("kaggle_notebooks")
      .select("owner, slug, title, language, working_source, original_source, status")
      .eq("id", notebookId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  };

  const readOnly = {
    read_notebook: tool({
      description: "Read the full source of the Kaggle notebook you are working on.",
      inputSchema: z.object({}),
      execute: async () => {
        const nb = await load();
        if (!nb) return { error: "Notebook not found" };
        if (!nb.working_source) return { error: "Notebook not synced yet. Ask the user to press Sync on the Account tab." };
        return { notebook: `${nb.owner}/${nb.slug}`, language: nb.language, source: nb.working_source.slice(0, 120_000) };
      },
    }),
    fetch_url: tool({
      description: "Fetch the text content of a URL (e.g., documentation, API reference, dataset page). Returns up to 50KB of content. Use this to read external resources needed for the notebook.",
      inputSchema: z.object({ url: z.string().describe("The URL to fetch") }),
      execute: async ({ url }) => fetchUrl(url),
    }),
    search_web: tool({
      description:
        "Search the web for a query and return titles, URLs and snippets of the top results. Use to look up API docs, package versions, dataset details or pandas/scikit/keras fixes instead of guessing. Read-only.",
      inputSchema: z.object({
        query: z.string().describe("The search query"),
        max_results: z.number().optional().describe("Max results (default 6, max 12)"),
      }),
      execute: async ({ query, max_results }) => webSearch(query ?? "", max_results ?? 6),
    }),
    search_notebook: tool({
      description: "Search the notebook source for a string or regex. Returns matching line numbers.",
      inputSchema: z.object({ query: z.string(), regex: z.boolean().optional() }),
      execute: async ({ query, regex }) => {
        const nb = await load();
        const src = nb?.working_source ?? "";
        let re: RegExp;
        try { re = regex ? new RegExp(query, "i") : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); }
        catch (e) { return { error: `Bad pattern: ${String(e)}` }; }
        const hits: Array<{ line: number; text: string }> = [];
        src.split("\n").forEach((l: string, i: number) => {
          if (hits.length < 60 && re.test(l)) hits.push({ line: i + 1, text: l.slice(0, 200) });
        });
        return { count: hits.length, hits };
      },
    }),
    check_code: tool({
      description:
        "Static review of the notebook source: unbalanced brackets, merge markers, obviously broken Python indentation, leftover TODO/FIXME, empty source. Call after editing and fix anything reported, then check again until clean.",
      inputSchema: z.object({}),
      execute: async () => {
        const nb = await load();
        const src = nb?.working_source ?? "";
        const problems: Array<{ issue: string; severity: "error" | "warning"; line?: number }> = [];
        const suggestions: Array<{ type: string; message: string; line?: number }> = [];
        if (!src.trim()) problems.push({ issue: "Notebook source is empty", severity: "error" });
        if (/^<{7}|^>{7}|^={7}$/m.test(src)) problems.push({ issue: "Leftover merge conflict markers", severity: "error" });
        // Count brackets only on code with strings/comments stripped, otherwise
        // brackets inside strings (e.g. print(")")) are miscounted.
        const code = stripPythonLiterals(src);
        for (const [o, c, label] of [["{", "}", "braces"], ["(", ")", "parens"], ["[", "]", "brackets"]] as const) {
          const a = code.split(o).length - 1, b = code.split(c).length - 1;
          if (a !== b) problems.push({ issue: `Unbalanced ${label} (${a} vs ${b})`, severity: "error" });
        }
        if (/\b(TODO|FIXME)\b/.test(src)) problems.push({ issue: "Contains TODO/FIXME left in the code", severity: "warning" });
        const lines = src.split("\n");
        lines.forEach((l: string, i: number) => {
          if (/:\s*$/.test(l.trim()) && /^(def|class|if|for|while|with|try|else|elif|except)\b/.test(l.trim())) {
            const next = lines[i + 1];
            if (next !== undefined && next.trim() && next.search(/\S/) <= l.search(/\S/)) {
              problems.push({ issue: `Line ${i + 2}: block opened on line ${i + 1} is not indented`, severity: "error", line: i + 1 });
            }
          }
          // Check for common Python issues
          if (/^\s*print\s*\(/i.test(l) && !/# noqa|# type: ignore/.test(l)) {
            problems.push({ issue: `Line ${i + 1}: Contains print() - consider using logging or removing before commit`, severity: "warning", line: i + 1 });
          }
          if (/import\s+pandas|from\s+pandas/.test(l) && !/as\s+pd/.test(l)) {
            problems.push({ issue: `Line ${i + 1}: pandas imported without 'as pd' alias - consider following convention`, severity: "warning", line: i + 1 });
          }
          
          // NEW: Detect potential performance issues in data processing
          if (/\.apply\s*\(/.test(l) && !/#.*vectorize/.test(l)) {
            suggestions.push({ type: "performance", message: "Using .apply() - consider vectorized operations for better performance", line: i + 1 });
          }
          if (/for\s+\w+\s+in\s+range\s*\(/.test(l) && /len\s*\(/.test(l)) {
            suggestions.push({ type: "performance", message: "Manual iteration with range(len()) - consider enumerate() or direct iteration", line: i + 1 });
          }
          
          // NEW: Detect deprecated patterns
          if (/\bix\b\s*\[/.test(l)) {
            problems.push({ issue: `Line ${i + 1}: Uses deprecated .ix[] indexer - use .loc[] or .iloc[] instead`, severity: "warning", line: i + 1 });
          }
        });
        return { problems, suggestions, clean: problems.length === 0 };
      },
    }),
  };

  if (!opts.allowWrites) return readOnly;

  // `update` reports no error when it matches no row (a wrong id, or a row the
  // caller cannot write under RLS), so ask for the row back and treat an empty
  // result as a failure instead of telling the model the edit was staged.
  const save = async (source: string) => {
    const { data, error } = await sb.from("kaggle_notebooks")
      .update({ working_source: source, status: "modified", updated_at: new Date().toISOString() })
      .eq("id", notebookId)
      .select("id")
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: "The notebook could not be saved — it was not found for this account. Tell the user to re-add or re-sync the notebook on the Account tab." };
    return { ok: true, bytes: source.length };
  };

  return {
    ...readOnly,
    write_notebook: tool({
      description: "Replace the entire notebook source. Pass the COMPLETE new source. Staged only — not pushed to Kaggle until the user commits.",
      inputSchema: z.object({ source: z.string() }),
      execute: async ({ source }) => save(source),
    }),
    edit_notebook: tool({
      description: "Replace an exact substring inside the notebook source. Prefer this for targeted edits.",
      inputSchema: z.object({ find: z.string(), replace: z.string(), replace_all: z.boolean().optional() }),
      execute: async ({ find, replace, replace_all }) => {
        const nb = await load();
        const src = nb?.working_source ?? "";
        if (!src.includes(find)) return { error: "The `find` text does not appear in the notebook. Read it again." };
        return save(replace_all ? src.split(find).join(replace) : src.replace(find, replace));
      },
    }),
    batch_edit_notebook: tool({
      description: "Apply multiple find/replace edits to the notebook source in a single operation. More efficient than calling edit_notebook repeatedly for multiple changes.",
      inputSchema: z.object({ edits: z.array(z.object({ find: z.string(), replace: z.string(), replace_all: z.boolean().optional() })).max(20) }),
      execute: async ({ edits }) => {
        const nb = await load();
        let src = nb?.working_source ?? "";
        const results: Array<{ find: string; success: boolean; error?: string }> = [];
        for (const edit of edits) {
          if (!src.includes(edit.find)) {
            results.push({ find: edit.find.slice(0, 50), success: false, error: "Find text not in notebook" });
            continue;
          }
          src = edit.replace_all ? src.split(edit.find).join(edit.replace) : src.replace(edit.find, edit.replace);
          results.push({ find: edit.find.slice(0, 50), success: true });
        }
        const saveResult = await save(src);
        if (saveResult.error) return { error: saveResult.error };
        const succeeded = results.filter(r => r.success).length;
        return { total: edits.length, succeeded, failed: edits.length - succeeded, results, bytes: src.length };
      },
    }),
  };
}
