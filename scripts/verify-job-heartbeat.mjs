#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

// Transpile the dependency-free server helper so this runs on the supported Node 22.
const source = await readFile(new URL("../src/lib/job-heartbeat.server.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { touchRunningJob, startJobHeartbeat, expireStaleKaggleJob, KAGGLE_STALE_MESSAGE } =
  await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

function database(handler = () => new Response("null", { status: 200 })) {
  const requests = [];
  const client = createClient("https://example.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (url, init) => {
      requests.push({ url: new URL(url), ...init, body: JSON.parse(init.body) });
      return handler();
    } },
  });
  return { client, requests };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

test("heartbeat executes the lazy Supabase PATCH and only touches running jobs", async () => {
  const { client, requests } = database();
  await touchRunningJob(client, "job-1");
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, "PATCH");
  assert.equal(requests[0].url.searchParams.get("id"), "eq.job-1");
  assert.equal(requests[0].url.searchParams.get("status"), "eq.running");
  assert.ok(Number.isFinite(Date.parse(requests[0].body.updated_at)));
});

test("heartbeat runs immediately, repeats every 30 seconds, and stops on cleanup", async (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  const { client, requests } = database();
  const stop = startJobHeartbeat(client, "job-1");
  t.after(stop);
  await flush();
  assert.equal(requests.length, 1);
  t.mock.timers.tick(30_000);
  await flush();
  assert.equal(requests.length, 2);
  stop();
  t.mock.timers.tick(60_000);
  await flush();
  assert.equal(requests.length, 2);
});

test("heartbeat retries after database errors instead of silently dying", async (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  const errors = t.mock.method(console, "error", () => {});
  const { client, requests } = database(() => new Response(JSON.stringify({ message: "unavailable" }), { status: 400 }));
  const stop = startJobHeartbeat(client, "job-1");
  t.after(stop);
  await flush();
  assert.equal(errors.mock.callCount(), 1);
  t.mock.timers.tick(30_000);
  await flush();
  assert.equal(requests.length, 2);
  assert.equal(errors.mock.callCount(), 2);
});

test("slow heartbeat requests do not overlap", async (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  let resolve;
  const { client, requests } = database(() => new Promise((r) => { resolve = r; }));
  const stop = startJobHeartbeat(client, "job-1");
  t.after(stop);
  await flush();
  t.mock.timers.tick(90_000);
  await flush();
  assert.equal(requests.length, 1);
  resolve(new Response("null"));
  await flush();
});

test("stale expiration guards against concurrent heartbeat/completion", async () => {
  const job = { id: "job-1", updated_at: "2026-09-10T00:00:00Z" };
  for (const matched of [true, false]) {
    const { client, requests } = database(() => new Response(JSON.stringify(matched ? { id: job.id } : null)));
    assert.equal(await expireStaleKaggleJob(client, job), matched);
    const params = requests[0].url.searchParams;
    assert.equal(params.get("updated_at"), `eq.${job.updated_at}`);
    assert.equal(params.get("status"), "eq.running");
    assert.equal(params.get("job_type"), "eq.kaggle");
    assert.equal(requests[0].body.error, KAGGLE_STALE_MESSAGE);
    assert.doesNotMatch(KAGGLE_STALE_MESSAGE, /tab was closed/);
  }
});
