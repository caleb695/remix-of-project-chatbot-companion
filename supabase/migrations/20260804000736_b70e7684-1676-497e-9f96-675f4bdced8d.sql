ALTER TABLE public.coding_jobs
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'build',
  ADD COLUMN IF NOT EXISTS task_id text;