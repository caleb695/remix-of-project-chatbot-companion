# Remix of Project Chatbot Companion

I want to build a web app where users can connect their GitHub to this web app and select one of their GitHub projects and enter in their openrouter API key and pick an openrouter model. Then they can chat with the model they selected and it can view and edit on their project.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2ddc4701-455a-4b78-a05d-232b2141097e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## The agent harness

Coderbot runs coding jobs two ways:

1. **GitHub Actions runner** — the app dispatches `repository_dispatch` events;
   `scripts/lovable-coder/runner.mjs` claims the job over HTTP from
   `/api/public/jobs/*`, runs an autonomous tool loop (files, shell, web,
   parallel sub-agents) against the checkout, pushes to a throwaway review
   branch, and the user approves the merge in the app. Long runs checkpoint
   their transcript and continue on a fresh runner before the 6h Actions wall.
2. **In-app streaming agent** — `src/routes/api/chat.ts` drives the AI SDK
   directly against the staged working copy (`src/lib/agent-tools.server.ts`)
   for plan-mode chats and Kaggle notebooks.

### Runner releases

The runner shipped to user repos lives in **`src/lib/runner/coder-runner.mjs.txt`**
(the single source of truth, inlined at build time by
`src/lib/workflow-template.server.ts`). The copy in
`scripts/lovable-coder/runner.mjs` must be **byte-identical** — it is what runs
when the workflow executes on this repository itself. After changing the runner:

```sh
cp src/lib/runner/coder-runner.mjs.txt scripts/lovable-coder/runner.mjs
# bump RUNNER_VERSION in src/lib/workflow-template.server.ts
# bump the "runner version N" comment in .github/workflows/lovable-coder.yml
npm run verify:runner   # syntax-checks the template, checks sync + version stamps
```

`npm run verify:runner` exists because a released runner once contained a
syntax error that crashed every job at parse time while jobs spun forever in
the UI; the check makes that class of failure fail loudly at lint time instead.

Runner behaviour worth knowing:

- Jobs are checkpointed near the 6h wall; the transcript, plan and uncommitted
  work carry into a fresh run.
- Token/call usage is accumulated from provider responses and reported in the
  job log (`[usage] N model calls · X prompt / Y completion tokens`).
- Index jobs are incremental: the claim response includes a `path → sha` map of
  what is already indexed, so unchanged files are skipped on re-index.
- Mid-run user messages (debug/improve modes) are picked up via
  `/api/public/jobs/new-messages`, using the `user_message_count` baseline from
  the claim response.

