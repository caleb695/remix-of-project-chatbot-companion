import { createFileRoute } from "@tanstack/react-router";
import { authJobRequest } from "@/lib/job-auth.server";

type FileIn = { path: string; sha: string; size: number; language: string | null; summary: string; symbols: { name: string; kind: string; line: number }[] };
type ChunkIn = { chunk_index: number; content: string; embedding: number[]; token_count: number };

export const Route = createFileRoute("/api/public/jobs/index-batch")({
  server: { handlers: { POST: async ({ request }) => {
    let ctx; try { ctx = await authJobRequest(request); } catch (r) { return r as Response; }
    const { job, sb } = ctx;
    const body = (await request.json()) as { file: FileIn; chunks: ChunkIn[] };
    const { file, chunks } = body;
    if (!file?.path) return new Response("bad file", { status: 400 });

    // Upsert repo_files row
    const { data: existing } = await sb.from("repo_files")
      .select("id, sha").eq("repo_selection_id", job.repo_selection_id).eq("path", file.path).maybeSingle();
    if (existing && existing.sha === file.sha) {
      return Response.json({ ok: true, unchanged: true });
    }

    const fileRow = {
      user_id: job.user_id,
      repo_selection_id: job.repo_selection_id,
      path: file.path,
      sha: file.sha,
      size: file.size,
      language: file.language,
      summary: file.summary,
      symbol_outline: (file.symbols ?? []).map((s) => s.name).join(", ").slice(0, 2000),
      updated_at: new Date().toISOString(),
    };
    let fileId: string;
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
        embedding: c.embedding as unknown as string, // pgvector accepts number[] as JSON
        token_count: c.token_count,
      }));
      const { error } = await sb.from("repo_file_chunks").insert(rows);
      if (error) return new Response(error.message, { status: 500 });
    }
    if (file.symbols?.length) {
      await sb.from("repo_symbols").insert(file.symbols.slice(0, 50).map((s) => ({
        user_id: job.user_id,
        repo_selection_id: job.repo_selection_id,
        repo_file_id: fileId,
        name: s.name,
        kind: s.kind,
        line: s.line,
      })));
    }
    return Response.json({ ok: true });
  } } },
});