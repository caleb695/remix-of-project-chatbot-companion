# Build plan

Two phases. Phase 1 is the core end-to-end coding loop you already approved. Phase 2 is the repo-indexing/RAG feature you added last.

## Decisions locked in
- **Commit style:** push straight to the repo's `working_branch` when the user hits a "Commit" button in chat.
- **Workflow install:** on first use of a repo, the app commits `.github/workflows/lovable-coder.yml` + `scripts/lovable-coder/*` into that repo.
- Long jobs run in GitHub Actions; short chats (no file edits) run in-browser via OpenRouter directly.

---

## Phase 1 — Coding pipeline

### 1. Workflow installer (server fn)
`installCoderWorkflow({ repoId })`:
- Uses the user's GitHub token to commit two files to the repo's default branch:
  - `.github/workflows/lovable-coder.yml` — triggers on `repository_dispatch` (`event_type: lovable-coding-job`).
  - `scripts/lovable-coder/runner.mjs` — Node script that polls our public API.
- Idempotent (skip if files exist).
- Stores `workflow_installed_at` on `repo_selections`.

### 2. Job queue
Uses existing `coding_jobs` table. New server fn `enqueueCodingJob({ threadId, messageId })`:
- Insert `coding_jobs` row: `queued`, HMAC secret, working branch.
- Fire `POST /repos/{o}/{r}/dispatches` with `{ event_type, client_payload: { jobId } }`.
- Returns jobId; chat UI polls status.

### 3. Public HMAC-signed endpoints (`/api/public/jobs/*`)
All verify `X-Signature = hmac_sha256(jobId + timestamp, job.hmac_secret)`:
- `POST /api/public/jobs/claim` — runner claims job → returns job spec, thread messages, context bundle, GitHub token (short-lived), OpenRouter key.
- `POST /api/public/jobs/checkpoint` — runner posts progress `{ status: 'checkpointed', checkpoint }` before the 6h timeout.
- `POST /api/public/jobs/log` — append streaming log lines (shown live in chat).
- `POST /api/public/jobs/complete` — final status + summary + list of files changed.

### 4. Runner script (in user's repo)
- Clones repo shallow into `$RUNNER_TEMP`.
- Loop: call OpenRouter with tools (`read_file`, `write_file`, `run_shell`, `list_dir`, `search`), apply edits to disk.
- Every 20 min or every ~50 tool calls → checkpoint (git commit to a scratch branch `lovable/job-<id>` + POST checkpoint).
- On completion: `git push origin <working_branch>` (fast-forward or force-with-lease onto working branch), POST complete.
- On 5h30m elapsed: checkpoint + exit cleanly. App re-dispatches a `continueOf` job that resumes from `checkpoint.branch`.

### 5. Chat UI additions
- Send button: if message is short/questiony → run in-browser (existing `/api/chat`). If it requests code changes → show "Run coding job" button that calls `enqueueCodingJob`.
- Live job panel in the thread showing status, log tail, "Cancel", "Commit to <branch>" button (job auto-commits on success, but a manual retry-commit is available if a checkpoint exists).
- Once completed, message shows diff summary + link to GitHub commit.

---

## Phase 2 — Repo index / RAG (do after Phase 1 works)

### 6. Index button on Account tab
Under each repo card add "Index repo" button. Opens sheet:
- Model picker (reuses the free-filter picker from chat), defaulting to a cheap free model.
- Starts a background job (same GitHub Actions runner, `job_type='index'`).

### 7. Indexing runner path
Runner script when `job_type === 'index'`:
1. Walk repo files (skip binaries, node_modules, etc — reuse existing filters).
2. For each file:
   - Compute sha; skip if `repo_files.sha` unchanged.
   - Chunk file into ~800-token windows with 100-token overlap.
   - Embed chunks via **Lovable AI Gateway** `google/gemini-embedding-001` (3072-dim, free-tier friendly) → insert into `repo_file_chunks(embedding vector(3072))`.
   - Ask the picked OpenRouter model for a **short** per-file summary (≤ 60 tokens: purpose + key exports) → `repo_files.summary`.
   - Extract top-level symbols (function/class/const exports) via lightweight regex per language → `repo_symbols`.
3. Post progress checkpoints (files/total) → live progress bar in Account tab.

### 8. Context assembler (used by chat + coding runner)
When the user sends a message in a chat tied to an indexed repo, before hitting the model we build the context in this order (hard token budget e.g. 40k, tunable):
1. **Repo tree outline** (paths only, folded), ≤ 1k tokens.
2. **Semantic search**: embed the user's message → top-K (K=8) chunks by cosine over `repo_file_chunks`.
3. **Symbol keyword search**: any identifier-looking token in the message → matching `repo_symbols` rows → pull their file summaries.
4. **Rolling thread summary**: `thread_summaries` holds a compressed summary of everything older than the last 6 messages; refreshed whenever the thread exceeds a threshold (background server fn, cheap model).
5. **Recent messages**: last 6 turns verbatim.
6. **Pending diff** (Phase 1 checkpoint, if resuming): the runner's uncommitted changes.

Dedupe by file path; if a full file is small (<300 lines) and heavily referenced, include the whole file instead of chunks.

### 9. Token-saving strategies applied
- Summaries capped at 60 tokens/file; never include a summary and full file both.
- Chunk overlap only 100 tokens (not 200) to reduce duplication.
- Cache embeddings by sha — never re-embed unchanged files.
- Rolling thread summary keeps chat history bounded regardless of length.
- Symbol table is text-only (~1 line per symbol), used for quick keyword hits without embedding search.
- Store `model_version` on `repo_file_chunks` so switching models triggers targeted re-embed, not full rebuild.

### 10. Re-index triggers
- Manual "Re-index" button.
- Auto: after each successful coding job's push, enqueue an incremental index job (only files whose sha changed).

---

## Ordering
Build strictly in this order; each step is verifiable before the next.
1. Workflow installer + `.github/workflows/lovable-coder.yml` template
2. `enqueueCodingJob` + `coding_jobs` status UI in chat
3. Public job endpoints + HMAC
4. Runner script (basic: read/write/commit, no checkpointing)
5. Checkpoint/resume
6. Phase 2: index button → embeddings pipeline
7. Context assembler wired into `/api/chat` and runner's model calls
8. Rolling thread summaries
9. Auto re-index after commit

## Open question
For the embedding model in Phase 2 I want to use `google/gemini-embedding-001` via **Lovable AI Gateway** (uses your Lovable Cloud credits, no extra key). The user's own OpenRouter key handles the coding/summarizing models. OK to mix providers like that, or do you want everything routed through OpenRouter using the user's key?
