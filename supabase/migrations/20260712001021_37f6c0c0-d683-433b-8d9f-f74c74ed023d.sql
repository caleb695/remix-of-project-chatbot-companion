
ALTER TABLE public.coding_jobs
  ADD COLUMN IF NOT EXISTS hmac_secret text,
  ADD COLUMN IF NOT EXISTS job_type text NOT NULL DEFAULT 'code',
  ADD COLUMN IF NOT EXISTS logs text DEFAULT '',
  ADD COLUMN IF NOT EXISTS commit_sha text,
  ADD COLUMN IF NOT EXISTS working_branch text,
  ADD COLUMN IF NOT EXISTS finished_at timestamptz;

ALTER TABLE public.repo_selections
  ADD COLUMN IF NOT EXISTS workflow_installed_at timestamptz,
  ADD COLUMN IF NOT EXISTS indexed_at timestamptz;

-- Allow service_role to read/update jobs when the runner hits public HMAC endpoints
GRANT ALL ON public.coding_jobs TO service_role;
GRANT ALL ON public.repo_selections TO service_role;
GRANT ALL ON public.chat_messages TO service_role;
GRANT ALL ON public.chat_threads TO service_role;
GRANT ALL ON public.github_connections TO service_role;
GRANT ALL ON public.openrouter_settings TO service_role;
