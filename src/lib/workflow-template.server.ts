// Server-only. Templates for the files we commit into the user's repo.
// The runner itself lives in ./runner/coder-runner.mjs.txt and is inlined at build time.
import RUNNER_SOURCE from "./runner/coder-runner.mjs.txt?raw";

/** Bump when the workflow or runner changes so installs re-write the files. */
export const RUNNER_VERSION = 13;

export const WORKFLOW_YML = `name: Coderbot
# Installed by Coderbot — runner version ${RUNNER_VERSION}
on:
  repository_dispatch:
    types: [lovable-coding-job]

jobs:
  run:
    runs-on: ubuntu-latest
    timeout-minutes: 350
    permissions:
      contents: write
    steps:
      - name: Mask job secret
        run: echo "::add-mask::\${{ github.event.client_payload.job_secret }}"
      - uses: actions/checkout@v4
        with:
          ref: \${{ github.event.client_payload.working_branch }}
          fetch-depth: 0
          token: \${{ secrets.GITHUB_TOKEN }}
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Run Coderbot
        env:
          JOB_ID: \${{ github.event.client_payload.job_id }}
          JOB_SECRET: \${{ github.event.client_payload.job_secret }}
          APP_URL: \${{ github.event.client_payload.app_url }}
          WORKING_BRANCH: \${{ github.event.client_payload.working_branch }}
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPOSITORY: \${{ github.repository }}
          VITE_PUBLIC_APP_URL: \${{ vars.VITE_PUBLIC_APP_URL }}
        run: node scripts/lovable-coder/runner.mjs
`;

export const RUNNER_MJS = RUNNER_SOURCE;
