
-- GitHub connections: one per user
CREATE TABLE public.github_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  github_user_id BIGINT NOT NULL,
  github_login TEXT NOT NULL,
  avatar_url TEXT,
  access_token TEXT NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.github_connections TO authenticated;
GRANT ALL ON public.github_connections TO service_role;
ALTER TABLE public.github_connections ENABLE ROW LEVEL SECURITY;
-- users can see they have a connection but NOT the access_token via client (we'll expose non-sensitive via server fn)
CREATE POLICY "own github connection read" ON public.github_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own github connection write" ON public.github_connections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Repo selections
CREATE TABLE public.repo_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_repo_id BIGINT NOT NULL,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  default_branch TEXT NOT NULL DEFAULT 'main',
  working_branch TEXT NOT NULL DEFAULT 'main',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, github_repo_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repo_selections TO authenticated;
GRANT ALL ON public.repo_selections TO service_role;
ALTER TABLE public.repo_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own repos" ON public.repo_selections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- OpenRouter settings per user
CREATE TABLE public.openrouter_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'anthropic/claude-3.5-sonnet',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.openrouter_settings TO authenticated;
GRANT ALL ON public.openrouter_settings TO service_role;
ALTER TABLE public.openrouter_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.openrouter_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Chat threads
CREATE TABLE public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_selection_id UUID NOT NULL REFERENCES public.repo_selections(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own threads" ON public.chat_threads FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON public.chat_threads (repo_selection_id, updated_at DESC);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  parts JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON public.chat_messages (thread_id, created_at ASC);

-- Working files: in-app editable copy of repo
CREATE TABLE public.working_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_selection_id UUID NOT NULL REFERENCES public.repo_selections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT,
  original_content TEXT,
  original_sha TEXT,
  status TEXT NOT NULL DEFAULT 'unchanged' CHECK (status IN ('unchanged','modified','added','deleted')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(repo_selection_id, path)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.working_files TO authenticated;
GRANT ALL ON public.working_files TO service_role;
ALTER TABLE public.working_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own files" ON public.working_files FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON public.working_files (repo_selection_id, path);

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER t_github_connections_updated BEFORE UPDATE ON public.github_connections FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_openrouter_settings_updated BEFORE UPDATE ON public.openrouter_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_chat_threads_updated BEFORE UPDATE ON public.chat_threads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_working_files_updated BEFORE UPDATE ON public.working_files FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
