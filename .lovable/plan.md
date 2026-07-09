## What we're building

A web app where signed-in users:
1. Sign in with email or Google
2. Connect their GitHub account via OAuth
3. Pick one of their repos + branch
4. Paste an OpenRouter API key and pick an OpenRouter model
5. Chat with the AI in threads. The AI can **read** and **edit** files in an in-app working copy of the repo
6. Review pending edits and click **Commit & Push** when they want those changes to land on GitHub

Nothing is pushed automatically. GitHub is only touched on explicit user action.

## Stack decisions

- Lovable Cloud (Supabase) for auth + Postgres + storage
- Email/password + Google sign-in (managed by Lovable Cloud)
- GitHub OAuth handled by us (needs a GitHub OAuth App — I will ask for `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` after Cloud is enabled)
- OpenRouter called directly from a server function with the user's own key
- Chat with AI SDK `useChat` + streaming server route
- Threads live under `/repos/$repoConnectionId/threads/$threadId`

## Data model (all with RLS scoped to `auth.uid()`)

- `github_connections` — one row per user: `github_user_id`, `github_login`, `access_token` (encrypted), `avatar_url`
- `repo_selections` — user's picked repos: `id`, `user_id`, `github_repo_id`, `owner`, `name`, `default_branch`, `working_branch`
- `openrouter_settings` — per user: `api_key` (encrypted), `model` (e.g. `anthropic/claude-3.5-sonnet`)
- `chat_threads` — `id`, `user_id`, `repo_selection_id`, `title`, `updated_at`
- `chat_messages` — `id`, `thread_id`, `role`, `parts` (jsonb UIMessage parts), `created_at`
- `working_files` — the in-app working copy: `id`, `repo_selection_id`, `path`, `content`, `sha` (original blob sha), `status` (`unchanged` | `modified` | `added` | `deleted`), `updated_at`

Secrets (API tokens, keys) stored server-side only, never sent to the browser.

## Routes

- `/auth` — sign in / sign up (email + Google)
- `/` — landing: if signed in, redirect to `/repos`
- `/_authenticated/repos` — list connected repos + "Connect GitHub" and "Add repo" actions
- `/_authenticated/repos/$repoId` — repo dashboard: thread list, file tree of working copy, "Commit & Push" button, settings (model + OpenRouter key)
- `/_authenticated/repos/$repoId/threads/$threadId` — chat view
- `/api/github/callback` — GitHub OAuth callback (public server route)
- `/api/chat` — streaming chat endpoint (auth required)

## Server functions & routes

- `startGithubOAuth` — returns authorize URL with signed `state`
- `/api/github/callback` — exchanges code for token, upserts `github_connections`
- `listUserRepos` — proxies GitHub `/user/repos` with the stored token
- `addRepoSelection(repoId)` — saves selection, initializes empty `working_files`
- `syncRepoFromGithub(repoId)` — pulls tree + file contents on the chosen branch into `working_files` (respects a size cap and skips binaries)
- `commitAndPush(repoId, message)` — creates a commit on `working_branch` with all `modified/added/deleted` files via GitHub's Git Data API, resets statuses to `unchanged`, refreshes shas
- `saveOpenrouterSettings({apiKey, model})`
- `listOpenrouterModels()` — proxies OpenRouter's `/models` so users can pick
- `createThread(repoId)` / `deleteThread(id)` / `listThreads(repoId)`
- `/api/chat` (POST) — auth-required streaming route. Loads thread, calls OpenRouter (OpenAI-compatible) with tools:
  - `list_files` — returns paths in `working_files`
  - `read_file(path)` — returns content
  - `write_file(path, content)` — updates/creates in `working_files`, marks status
  - `delete_file(path)` — marks deleted
  - Persists user + assistant messages in `onFinish`

The AI edits ONLY the in-app working copy. Nothing hits GitHub until the user clicks Commit & Push.

## UI

- Dark, developer-tool aesthetic. Mono font for code, clean sans for chrome. Tokens in `src/styles.css`.
- Repo dashboard is a 3-pane layout: threads (left), chat (center) or file diff view (center when reviewing), file tree + status badges (right)
- "Pending changes" chip with count on the dashboard header; button opens a diff review modal then Commit & Push

## Technical notes (skim if non-technical)

- GitHub tokens & OpenRouter keys stored in Supabase with a `pgsodium`/`vault`-style encryption column, or at minimum in a table only the service role can read (accessed via `requireSupabaseAuth` server functions that fetch on the user's behalf)
- Working copy is capped (e.g. skip files > 500KB, skip common binary extensions, skip `node_modules`, `.git`, build artifacts) to keep the DB reasonable
- Commit uses GitHub's Git Data API (create blobs → tree → commit → update ref) so multi-file commits are atomic
- Chat uses AI SDK `streamText` with an OpenAI-compatible provider pointed at `https://openrouter.ai/api/v1`, `stopWhen: stepCountIs(50)` for tool loops
- `listOpenrouterModels` also uses the user's key so we don't need our own

## Build order

1. Enable Lovable Cloud + configure email/Google auth
2. Ask user for GitHub OAuth App credentials
3. Design system + shell layout + auth page
4. DB schema + RLS + storage of tokens
5. GitHub OAuth flow + repo picker + sync
6. OpenRouter settings UI + model picker
7. Threads + chat streaming with file tools
8. Diff review + Commit & Push
9. Polish (empty states, errors, loading)

## What I need from you

Just approve and I'll start with Cloud + auth. When I get to the GitHub step I'll walk you through creating a GitHub OAuth App (2 minutes) and ask for the client ID/secret.