ALTER TABLE public.chat_threads ADD COLUMN IF NOT EXISTS sub_agents jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.chat_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  name text NOT NULL,
  mime_type text,
  size_bytes integer,
  storage_path text NOT NULL,
  code_only boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_attachments TO authenticated;
GRANT ALL ON public.chat_attachments TO service_role;
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own attachments select" ON public.chat_attachments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own attachments insert" ON public.chat_attachments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own attachments update" ON public.chat_attachments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own attachments delete" ON public.chat_attachments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "own files read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own files write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own files delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);