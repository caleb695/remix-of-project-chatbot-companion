## Big picture

Rework the app into a **mobile-first two-tab PWA-style layout** with all coding work happening in the browser + GitHub Actions (for long jobs). No local repo required — everything runs against the user's actual GitHub repo through the API.

## Layout (mobile-first, fits phone)

Fixed bottom tab bar with two icons:

- **Tab 1 — Account** (`/account`)
  - Header: GitHub avatar + login
  - "Connect GitHub" button if not connected
  - List of all repos on the account (searchable). Tap a repo to mark it selected/available for chats.
  - OpenRouter API key input + save (persisted to `openrouter_settings`)
  - Sign out
- **Tab 2 — Chat** (`/chat` and `/chat/$threadId`)
  - Top bar: **☰ (three dots) on the left** → opens slide-in sidebar with:
    - "＋ New chat" button at top
    - List of past chats (persisted in `chat_threads`, ordered by updated_at)
  - Main area: message list, fits viewport (`h-[100dvh]` layout, safe-area padding).
  - Above the input row: **repo selector** (which repo this chat targets).
  - Input row: **model picker on the LEFT** of the textarea + textarea + send button.
    - Model picker opens a sheet with a search box and a **"Free" toggle** that filters to models where prompt+completion price = 0.
    - Selected model is stored per-thread (new column `model` on `chat_threads`).

## GitHub Actions execution (long-running jobs)

Move actual file editing off the web server. The web app queues a "job" and a GitHub Actions workflow in the user's repo does the work using the OpenRouter key + our webhook.

- On first use per repo, we commit a workflow file `.github/workflows/lovable-coder.yml` to the user's repo (via GitHub API) that:
  1. Triggers on `repository_dispatch` event `lovable-coder-run` with payload `{ jobId }`
  2. Checks out the repo
  3. Calls our public API `/api/public/jobs/next` with the jobId to get the task + prior state
  4. Runs the AI agent loop (Node script committed alongside the workflow) that:
    - Calls OpenRouter with tools: `list_files`, `read_file`, `write_file`, `delete_file`, `run_command`, `search_code`
    - Every N steps or before the **5h 30m soft-deadline**, POSTs current progress + tool history + working tree diff to `/api/public/jobs/checkpoint`
  5. On timeout-approach: commits a checkpoint branch, saves state to our DB, triggers a fresh dispatch to continue (`continueOf: jobId`).
  6. On completion: opens a PR or commits to the working branch (per user setting).
- Web app kicks off jobs by:
  - Inserting `chat_messages` + a `coding_jobs` row
  - Calling GitHub REST `POST /repos/{o}/{r}/dispatches` with our stored token
  - Chat UI subscribes to the `coding_jobs` row via Supabase realtime and streams progress updates as tool-call parts
- Users should be able to choose running in the browser or GitHub actions in a chat.

## Context-window maximization

New tables + strategies so each model call sends only what's relevant:

- `repo_files` — one row per file: `path`, `sha`, `size`, `summary` (LLM-generated 1-2 sentence description), `symbol_outline` (exports/functions/classes), `updated_at`
- `repo_file_chunks` — chunked file contents (~800 tokens each) with `embedding vector(3072)` using `google/gemini-embedding-001` via Lovable AI
- `repo_symbols` — extracted top-level symbol names per file for fast keyword lookup
- `thread_summaries` — rolling summary of the conversation so old turns can be dropped from the prompt

On each user message we build the model context by:

1. Semantic search over `repo_file_chunks` (top K by cosine)
2. Keyword match over `repo_symbols` for any identifier the user mentioned
3. File tree outline (paths + short summaries only, no contents)
4. Last N raw turns + `thread_summaries` for older history
5. Pending working-tree diff from the current job

Indexing runs as a separate background GitHub Actions job (`lovable-coder-index.yml`) triggered on repo sync and on push events, so we don't block chat.

## Data model changes

New tables (RLS scoped to `auth.uid()`):

- `coding_jobs`: id, thread_id, repo_selection_id, status (`queued|running|checkpointed|completed|failed`), prompt, current_step, continue_of, workflow_run_id, checkpoint jsonb, diff jsonb, created_at
- `repo_files`, `repo_file_chunks` (with `vector(3072)`), `repo_symbols`, `thread_summaries` as above
- Enable `pgvector`

Modify:

- `chat_threads`: add `model text`, `last_summary_at timestamptz`
- Drop the `working_files` sync-everything-to-DB approach (the DB now stores summaries/embeddings, not full working copies — the Actions runner is the source of truth for working files during a job)

## Routes

- `/account` — Account tab
- `/chat` — redirects to newest thread or creates one
- `/chat/$threadId` — chat view (keyed by threadId)
- Bottom tab bar rendered in `_authenticated/route.tsx`
- `/api/public/jobs/next` `POST` — Actions runner fetches job spec (HMAC signed)
- `/api/public/jobs/checkpoint` `POST` — Actions runner streams progress
- `/api/public/jobs/complete` `POST` — final result
- `/api/github/webhook` — receive push events to re-index

## Build order

1. DB migration: new tables, pgvector, thread `model` column, drop working_files reads
2. New layout shell with bottom tab bar (mobile-first)
3. Account tab (repos list + OpenRouter key)
4. Chat tab UI with sidebar, model picker (search + Free filter), repo selector
5. In-browser short chat path (no tools) with rolling summary
6. GitHub Actions workflow scaffolder + `repository_dispatch` job kickoff
7. Public job endpoints + HMAC + realtime progress
8. Indexing pipeline (embeddings + summaries) via second workflow
9. Context assembler that combines RAG + summaries + diff
10. Polish (empty states, mobile safe areas, errors)

## What I need from you

Two quick confirmations before I start:

1. **Auto-commit vs PR**: when the Actions job finishes, should it push straight to your `working_branch` or open a Pull Request? (PR is safer, direct-commit is faster.)
2. **Workflow install**: OK for the app to commit `.github/workflows/lovable-coder.yml` + a small `scripts/lovable-coder/` runner into each repo the first time you use it? (Required for Actions execution.)

Reply with your picks and I'll start building.