ALTER TABLE public.openrouter_settings
  ADD COLUMN IF NOT EXISTS groq_api_key text,
  ADD COLUMN IF NOT EXISTS nvidia_api_key text,
  ADD COLUMN IF NOT EXISTS embedding_provider text NOT NULL DEFAULT 'mistral',
  ADD COLUMN IF NOT EXISTS embedding_model text NOT NULL DEFAULT 'mistral-embed';

ALTER TABLE public.openrouter_settings
  ADD CONSTRAINT openrouter_settings_embedding_provider_check
  CHECK (embedding_provider IN ('mistral', 'openrouter', 'nvidia'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.openrouter_settings TO authenticated;
GRANT ALL ON public.openrouter_settings TO service_role;