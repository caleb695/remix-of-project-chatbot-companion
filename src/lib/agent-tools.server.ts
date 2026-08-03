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

export function buildAgentTools(ctx: ToolCtx, opts: { allowWrites: boolean }) {
  const { sb, userId, repoId } = ctx;

  const readOnly = {
    list_files: tool({
      description:
        "List files in the working copy of the repository. Optionally filter by a path prefix or glob-ish substring.",
      inputSchema: z.object({
        prefix: z.string().optional().describe("Only return paths containing this substring"),
      }),
      execute: async ({ prefix }) => {
        const { data, error } = await sb
          .from("working_files")
          .select("path, status")
          .eq("repo_selection_id", repoId)
          .neq("status", "deleted")
          .order("path");
        if (error) return { error: error.message };
        let rows = data ?? [];
        if (prefix) rows = rows.filter((r) => r.path.includes(prefix));
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

        const problems: Array<{ path: string; issue: string }> = [];
        for (const f of files) {
          const content = f.content ?? "";
          if (!content.trim()) {
            problems.push({ path: f.path, issue: "File is empty" });
            continue;
          }
          if (/^<{7}|^>{7}|^={7}$/m.test(content)) {
            problems.push({ path: f.path, issue: "Leftover merge conflict markers" });
          }
          for (const [open, close, label] of [["{", "}", "braces"], ["(", ")", "parens"], ["[", "]", "brackets"]] as const) {
            const o = content.split(open).length - 1;
            const c = content.split(close).length - 1;
            if (o !== c) problems.push({ path: f.path, issue: `Unbalanced ${label} (${o} vs ${c})` });
          }
          if (/\b(TODO|FIXME)\b/.test(content)) {
            problems.push({ path: f.path, issue: "Contains TODO/FIXME left in the code" });
          }
          const importRe = /(?:from|require\()\s*['"](\.[^'"]+)['"]/g;
          let m: RegExpExecArray | null;
          while ((m = importRe.exec(content))) {
            const spec = m[1];
            const base = resolveRelative(f.path, spec);
            const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.mjs`,
              `${base}/index.ts`, `${base}/index.tsx`, `${base}/index.js`, `${base}.py`, `${base}.css`, `${base}.json`];
            if (!candidates.some((c) => existing.has(c))) {
              problems.push({ path: f.path, issue: `Imports missing local file: ${spec}` });
            }
          }
        }
        return { checked: files.map((f) => f.path), problems, clean: problems.length === 0 };
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
