CREATE TABLE public.agent_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  task_id text NOT NULL,
  agent_id text NOT NULL DEFAULT 'main',
  agent_label text NOT NULL DEFAULT 'Main agent',
  phase text NOT NULL DEFAULT 'planning',
  kind text NOT NULL DEFAULT 'thought',
  text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_events TO authenticated;
GRANT ALL ON public.agent_events TO service_role;

ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own agent events" ON public.agent_events
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX agent_events_thread_task_idx ON public.agent_events (thread_id, task_id, created_at);

ALTER TABLE public.chat_threads
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'build',
  ADD COLUMN IF NOT EXISTS seed_summary text;