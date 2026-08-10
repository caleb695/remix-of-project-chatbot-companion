ALTER TABLE public.coding_jobs
  ADD COLUMN IF NOT EXISTS review_branch text,
  ADD COLUMN IF NOT EXISTS changed_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS summary text;