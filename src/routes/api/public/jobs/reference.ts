import { createFileRoute } from "@tanstack/react-router";
import { authJobRequest } from "@/lib/job-auth.server";

const MAX_READ = 60_000;

function repoParts(repo: string) {
  const [owner, name] = repo.split("/");
  if (!owner || !name) throw new Error("Use repo as owner/name");
  return { owner, name };
}

export const Route = createFileRoute("/api/public/jobs/reference")({
  server: { handlers: { POST: async ({ request }) => {
    let ctx;
    try { ctx = await authJobRequest(request); } catch (r) { return r as Response; }
    const { job, sb } = ctx;
    const body = (await request.json().catch(() => ({}))) as {
      action?: string; repo?: string; path?: string; prefix?: string; query?: string; regex?: boolean; max_results?: number;
    };

    const currentRepoId = job.repo_selection_id;
    const findRepo = async (repo: string) => {
      const { owner, name } = repoParts(repo);
      const { data, error } = await sb
        .from("repo_selections")
        .select("id, owner, name")
        .eq("user_id", job.user_id)
        .eq("owner", owner)
        .eq("name", name)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(`Reference repo not found or not connected: ${repo}`);
      return data;
    };

    try {
      if (body.action === "list_repos") {
        const { data, error } = await sb
          .from("repo_selections")
          .select("owner, name, indexed_at")
          .eq("user_id", job.user_id)
          .neq("id", currentRepoId)
          .order("owner");
        if (error) throw error;
        return Response.json({ repos: (data ?? []).map((r) => `${r.owner}/${r.name}${r.indexed_at ? "" : " (not indexed/synced yet)"}`) });
      }

      if (!body.repo) throw new Error("repo is required");
      const repo = await findRepo(body.repo);

      if (body.action === "list_files") {
        const { data, error } = await sb
          .from("working_files")
          .select("path")
          .eq("repo_selection_id", repo.id)
          .neq("status", "deleted")
          .order("path");
        if (error) throw error;
        let rows = data ?? [];
        if (body.prefix) rows = rows.filter((r) => r.path.includes(body.prefix!));
        return Response.json({ repo: body.repo, count: rows.length, files: rows.slice(0, 800).map((r) => r.path) });
      }

      if (body.action === "read_file") {
        if (!body.path) throw new Error("path is required");
        const { data, error } = await sb
          .from("working_files")
          .select("content, status")
          .eq("repo_selection_id", repo.id)
          .eq("path", body.path)
          .maybeSingle();
        if (error) throw error;
        if (!data || data.status === "deleted") throw new Error(`Not found in ${body.repo}: ${body.path}`);
        const content = data.content ?? "";
        return Response.json({ repo: body.repo, path: body.path, content: content.slice(0, MAX_READ), truncated: content.length > MAX_READ });
      }

      if (body.action === "search_code") {
        if (!body.query) throw new Error("query is required");
        const { data, error } = await sb
          .from("working_files")
          .select("path, content")
          .eq("repo_selection_id", repo.id)
          .neq("status", "deleted");
        if (error) throw error;
        const re = body.regex
          ? new RegExp(body.query, "i")
          : new RegExp(body.query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        const limit = Math.min(body.max_results ?? 60, 200);
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
        return Response.json({ repo: body.repo, count: hits.length, hits });
      }

      throw new Error("Unknown reference action");
    } catch (e) {
      return Response.json({ error: e instanceof Error ? e.message : "reference lookup failed" }, { status: 400 });
    }
  } } },
});
