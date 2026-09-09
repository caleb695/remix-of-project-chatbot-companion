#!/usr/bin/env node
/* Guard for the Coderbot agent harness. Run via `npm run verify:runner`.
 *
 * The runner is shipped to user repositories as `src/lib/runner/coder-runner.mjs.txt`
 * and a copy is committed to `scripts/lovable-coder/runner.mjs` (the workflow runs
 * the scripts/ copy on this repo itself). A past release shipped a runner with a
 * syntax error (escaped quotes) which crashed EVERY job at parse time while the
 * UI showed the job spinning forever. This script makes that class of failure
 * impossible to merge:
 *
 *   1. The template must parse as valid JavaScript (`node --check`).
 *   2. The scripts/ copy must be byte-identical to the template.
 *   3. The workflow yml stamped in this repo and the generated WORKFLOW_YML
 *      must reference the current RUNNER_VERSION.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const TEMPLATE = path.join(root, "src/lib/runner/coder-runner.mjs.txt");
const SCRIPTS_COPY = path.join(root, "scripts/lovable-coder/runner.mjs");
const WORKFLOW = path.join(root, ".github/workflows/lovable-coder.yml");
const TEMPLATE_TS = path.join(root, "src/lib/workflow-template.server.ts");

let failed = false;
const fail = (msg) => { console.error("✗ " + msg); failed = true; };
const ok = (msg) => console.log("✓ " + msg);

const template = fs.readFileSync(TEMPLATE, "utf8");

// 1. The template must be valid JavaScript.
const tmp = path.join(os.tmpdir(), "coder-runner-check-" + process.pid + ".mjs");
fs.writeFileSync(tmp, template);
try {
  execFileSync(process.execPath, ["--check", tmp], { stdio: "pipe" });
  ok("runner template parses as valid JavaScript (" + template.split("\n").length + " lines)");
} catch (e) {
  fail("runner template has a SYNTAX ERROR — every dispatched job would crash:\n" + String(e.stderr || e));
} finally {
  fs.rmSync(tmp, { force: true });
}

// Obvious escape-corruption marker (the historical bug): a quote escaped with a
// backslash outside of string/regex contexts is hard to detect generically, but
// `=\"` / `=== \"` sequences in statement position are always wrong.
if (/(?:===|!==|return)\s*\\"/.test(template)) {
  fail('runner template contains suspicious literal \\" sequences in code position');
} else {
  ok("no literal escape-corruption markers");
}

// 2. The scripts/ copy must match the template byte for byte.
if (!fs.existsSync(SCRIPTS_COPY)) {
  fail("scripts/lovable-coder/runner.mjs is missing — copy the template there");
} else if (fs.readFileSync(SCRIPTS_COPY, "utf8") !== template) {
  fail("scripts/lovable-coder/runner.mjs differs from src/lib/runner/coder-runner.mjs.txt — re-copy it");
} else {
  ok("scripts/lovable-coder/runner.mjs is identical to the template");
}

// 3. Version stamps must agree.
const ts = fs.readFileSync(TEMPLATE_TS, "utf8");
const version = Number(/RUNNER_VERSION\s*=\s*(\d+)/.exec(ts)?.[1] ?? 0);
if (!version) fail("could not read RUNNER_VERSION from workflow-template.server.ts");
else {
  const generatedYml = new RegExp(`runner version \\$\{RUNNER_VERSION\\}`).test(ts) || ts.includes("runner version ${RUNNER_VERSION}");
  if (!generatedYml) fail("WORKFLOW_YML template no longer stamps the runner version");
  else ok("workflow template stamps RUNNER_VERSION");

  const repoYml = fs.readFileSync(WORKFLOW, "utf8");
  const repoVersion = Number(/runner version (\d+)/.exec(repoYml)?.[1] ?? 0);
  if (repoVersion !== version) {
    fail(`.github/workflows/lovable-coder.yml says runner version ${repoVersion || "?"} but RUNNER_VERSION is ${version} — update the yml comment`);
  } else {
    ok(`version stamps agree (runner version ${version})`);
  }

  // The template must also reference the runner path the workflow executes.
  if (!template.includes("api(") || !template.includes("/api/public/jobs/claim")) {
    fail("runner template does not look like a Coderbot runner (no claim call)");
  } else {
    ok("runner template contains the job claim handshake");
  }
}

if (failed) {
  console.error("\nverify:runner FAILED — fix the issues above before committing.");
  process.exit(1);
}
console.log("\nverify:runner passed.");
