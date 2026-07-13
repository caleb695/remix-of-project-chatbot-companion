
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
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT c.id, c.repo_file_id, f.path, c.content,
         1 - (c.embedding::halfvec(1024) <=> p_query::halfvec(1024)) AS similarity
  FROM public.repo_file_chunks c
  JOIN public.repo_files f ON f.id = c.repo_file_id
  WHERE c.repo_selection_id = p_repo_selection_id
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding::halfvec(1024) <=> p_query::halfvec(1024)
  LIMIT p_match_count;
$$;

REVOKE ALL ON FUNCTION public.match_repo_chunks(uuid, vector, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_repo_chunks(uuid, vector, int) TO authenticated, service_role;
