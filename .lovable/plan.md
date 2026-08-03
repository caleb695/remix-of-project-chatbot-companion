# Agentic Coder — build plan

Everything you listed is doable, but it's ~4 distinct systems. I want to build it in 4 phases so each one actually works before the next lands. Phase 1 fixes the broken/annoying things you hit today.

## Phase 1 — Make it a real agent + fix the interface

**Real editing, staged until you commit**
- Chat gets actual tools (`list_files`, `read_file`, `write_file`, `delete_file`, `search`) that write to the in-app working copy (the `working_files` table), never straight to GitHub. No more roleplaying.
- A **Commit** bar appears above the composer whenever there are staged changes: shows changed file count, lets you view the diff, and pushes to your working branch on click. The ⚡ button becomes "Run in Actions" for long/heavy tasks only, and I'll fix its current error.

**Agent loop (build/debug/improve modes)**
- The agent runs a tool loop: plan → edit → check (typecheck/lint/build via Actions or static checks) → fix → re-check, repeated until clean, then it reports what it did.
- **Modes** selector on the composer: `Plan` (chat/brainstorm only, no writes), `Build` (full agentic coding), `Debug` (find + fix real issues), `Improve` (features, cleanup, perf). Mode changes the system prompt and which tools are allowed.

**Live process indicator**
- Status line always visible: `Waiting → Planning → Coding → Checking code → Debugging → Done`.
- Tapping it opens a full-screen activity view streaming the agent's thoughts and actions for that task (`Edited src/foo.ts`, `Ran bun test`, `I think…`) — full history for the task, no raw code.

**Mobile composer rebuild (iPhone)**
- Composer pinned to the bottom using the visual-viewport API so it sits right above the iOS keyboard and stays visible while typing.
- Textarea spans edge-to-edge, grows upward as you type (up to ~45% of the screen), message list shrinks accordingly.
- Controls move to a compact row above the textarea instead of crowding it.

**Model picker fixes**
- Only providers with a saved API key appear. Free filter removed.

**Branch into new chat**
- Button that summarizes the current chat (key points + main ideas, via your selected model), creates a new thread, injects the summary as system context, and navigates you there.

## Phase 2 — Sub-agents
- Button next to the model picker to add sub-agents; each gets its own model and an optional instruction ("what this one should do").
- Main agent splits the task, works its own part, delegates the rest, and reports each sub-agent's progress alongside its own.
- One clickable process row per sub-agent in the activity view, with its own thought/action history.
- Rate-limit policy: on RPM limits, wait 10s and retry indefinitely; on any other limit (quota/credits/context), stop that agent and show the error text below the process rows.

## Phase 3 — File uploads
- Attach any file type, plus iPhone photo library, from the composer.
- Per-attachment toggle: **Code-only** (agent can't read contents, only reference/use the file in code) vs **Readable** (agent reads it into context, including vision for images).
- Files stored in backend storage, wired into the working copy so committed files land in the repo.

## Phase 4 — Kaggle notebooks
- Kaggle username + API key on the Account tab.
- Pick a Kaggle notebook as a coding target instead of a GitHub repo, using Kaggle's kernels API (pull source, edit, push new version).
- Same agent loop, modes, and process view; target selector in the chat header switches between GitHub repo and Kaggle notebook.

## Technical notes
- Agent loop runs server-side (`streamText` + `stopWhen(stepCountIs(50+))`) for interactive work; the existing GitHub Actions runner stays for long jobs, with its checkpoint/resume so 6h limits don't kill a task.
- Thoughts/actions persist to a new `agent_events` table (job/thread scoped, RLS by user) so the activity view can replay past steps, not just live ones.
- Sub-agents run as parallel `streamText` calls sharing the same working copy, each emitting into `agent_events` with its own agent id.
- All provider calls keep your own keys (OpenRouter/Mistral/Groq/NVIDIA); rate-limit retry wraps the shared fetch layer.

Say go and I'll start on Phase 1.
