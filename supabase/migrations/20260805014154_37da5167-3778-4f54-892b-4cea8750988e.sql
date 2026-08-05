alter table public.openrouter_settings
  add column if not exists kaggle_username text,
  add column if not exists kaggle_key text;

create table if not exists public.kaggle_notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  owner text not null,
  slug text not null,
  title text not null,
  language text not null default 'python',
  kernel_type text not null default 'notebook',
  is_private boolean not null default true,
  enable_gpu boolean not null default false,
  enable_internet boolean not null default true,
  dataset_sources jsonb not null default '[]'::jsonb,
  original_source text,
  working_source text,
  status text not null default 'unchanged',
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (user_id, owner, slug)
);

grant select, insert, update, delete on public.kaggle_notebooks to authenticated;
grant all on public.kaggle_notebooks to service_role;
alter table public.kaggle_notebooks enable row level security;
create policy "own kaggle notebooks" on public.kaggle_notebooks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger kaggle_notebooks_touch before update on public.kaggle_notebooks
  for each row execute function public.touch_updated_at();

alter table public.chat_threads alter column repo_selection_id drop not null;
alter table public.chat_threads
  add column if not exists kaggle_notebook_id uuid references public.kaggle_notebooks(id) on delete cascade,
  add column if not exists target text not null default 'github';