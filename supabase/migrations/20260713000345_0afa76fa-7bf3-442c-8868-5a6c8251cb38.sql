
-- Add Mistral API key for embeddings
ALTER TABLE public.openrouter_settings ADD COLUMN IF NOT EXISTS mistral_api_key text;

-- Resize embedding column to Mistral 1024 dims (no data yet)
DROP INDEX IF EXISTS repo_file_chunks_embedding_idx;
ALTER TABLE public.repo_file_chunks ALTER COLUMN embedding TYPE vector(1024) USING NULL;
CREATE INDEX repo_file_chunks_embedding_idx
  ON public.repo_file_chunks
  USING hnsw ((embedding::halfvec(1024)) halfvec_cosine_ops);

-- Semantic search RPC scoped to a single repo (SECURITY DEFINER + user_id filter for RLS-safe access)
CREATE OR REPLACE FUNCTION public.match_repo_chunks(
  p_repo_selection_id uuid,
  p_query vector(1024),
  p_match_count int DEFAULT 8
)
RETURNS TABLE (
  chunk_id uuid,
  repo_file_id uuid,
  path text,
  content text,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.repo_file_id, f.path, c.content,
         1 - (c.embedding::halfvec(1024) <=> p_query::halfvec(1024)) AS similarity
  FROM public.repo_file_chunks c
  JOIN public.repo_files f ON f.id = c.repo_file_id
  WHERE c.repo_selection_id = p_repo_selection_id
    AND c.user_id = auth.uid()
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding::halfvec(1024) <=> p_query::halfvec(1024)
  LIMIT p_match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_repo_chunks(uuid, vector, int) TO authenticated, service_role;

-- Track indexing progress on coding_jobs
ALTER TABLE public.coding_jobs ADD COLUMN IF NOT EXISTS progress_current int DEFAULT 0;
ALTER TABLE public.coding_jobs ADD COLUMN IF NOT EXISTS progress_total int DEFAULT 0;
