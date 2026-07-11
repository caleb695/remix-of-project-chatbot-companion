
CREATE EXTENSION IF NOT EXISTS vector;

-- Threads: model per thread + rolling summary marker
ALTER TABLE public.chat_threads
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS last_summary_at timestamptz;

-- Coding jobs
CREATE TABLE public.coding_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  repo_selection_id uuid NOT NULL REFERENCES public.repo_selections(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued',
  prompt text NOT NULL,
  model text,
  current_step int NOT NULL DEFAULT 0,
  continue_of uuid REFERENCES public.coding_jobs(id) ON DELETE SET NULL,
  workflow_run_id text,
  checkpoint jsonb NOT NULL DEFAULT '{}'::jsonb,
  diff jsonb NOT NULL DEFAULT '[]'::jsonb,
  progress jsonb NOT NULL DEFAULT '[]'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coding_jobs TO authenticated;
GRANT ALL ON public.coding_jobs TO service_role;

ALTER TABLE public.coding_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own coding jobs" ON public.coding_jobs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER coding_jobs_touch_updated_at BEFORE UPDATE ON public.coding_jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX coding_jobs_thread_idx ON public.coding_jobs(thread_id, created_at DESC);
CREATE INDEX coding_jobs_status_idx ON public.coding_jobs(status);

-- Repo files (per-path summary + outline)
CREATE TABLE public.repo_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  repo_selection_id uuid NOT NULL REFERENCES public.repo_selections(id) ON DELETE CASCADE,
  path text NOT NULL,
  sha text,
  size int,
  summary text,
  symbol_outline text,
  language text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (repo_selection_id, path)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.repo_files TO authenticated;
GRANT ALL ON public.repo_files TO service_role;

ALTER TABLE public.repo_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own repo files" ON public.repo_files FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER repo_files_touch_updated_at BEFORE UPDATE ON public.repo_files
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX repo_files_repo_idx ON public.repo_files(repo_selection_id);

-- File chunks with embeddings (3072-dim gemini-embedding-001)
CREATE TABLE public.repo_file_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  repo_selection_id uuid NOT NULL REFERENCES public.repo_selections(id) ON DELETE CASCADE,
  repo_file_id uuid NOT NULL REFERENCES public.repo_files(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,
  embedding vector(3072),
  token_count int,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.repo_file_chunks TO authenticated;
GRANT ALL ON public.repo_file_chunks TO service_role;

ALTER TABLE public.repo_file_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own repo file chunks" ON public.repo_file_chunks FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX repo_file_chunks_repo_idx ON public.repo_file_chunks(repo_selection_id);
CREATE INDEX repo_file_chunks_file_idx ON public.repo_file_chunks(repo_file_id);
CREATE INDEX repo_file_chunks_embedding_idx
  ON public.repo_file_chunks
  USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

-- Symbols (fast keyword lookup)
CREATE TABLE public.repo_symbols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  repo_selection_id uuid NOT NULL REFERENCES public.repo_selections(id) ON DELETE CASCADE,
  repo_file_id uuid NOT NULL REFERENCES public.repo_files(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text,
  line int
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.repo_symbols TO authenticated;
GRANT ALL ON public.repo_symbols TO service_role;

ALTER TABLE public.repo_symbols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own repo symbols" ON public.repo_symbols FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX repo_symbols_repo_name_idx ON public.repo_symbols(repo_selection_id, name);

-- Rolling conversation summaries
CREATE TABLE public.thread_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  summary text NOT NULL,
  covers_up_to timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.thread_summaries TO authenticated;
GRANT ALL ON public.thread_summaries TO service_role;

ALTER TABLE public.thread_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own thread summaries" ON public.thread_summaries FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX thread_summaries_thread_idx ON public.thread_summaries(thread_id, created_at DESC);
