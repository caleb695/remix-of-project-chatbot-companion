import type { SupabaseClient } from "@supabase/supabase-js";

/** Supabase query builders are lazy: `void query` does not send a request. */
export async function touchRunningJob(supabase: SupabaseClient, jobId: string) {
  const { error } = await supabase.from("coding_jobs")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("status", "running");
  if (error) throw error;
}

/** Keep quiet model generations alive without overlapping database requests. */
export function startJobHeartbeat(supabase: SupabaseClient, jobId: string) {
  let pending = false;
  let stopped = false;
  const beat = async () => {
    if (pending || stopped) return;
    pending = true;
    try {
      await touchRunningJob(supabase, jobId);
    } catch (error) {
      console.error("[chat] job heartbeat failed:", error);
    } finally {
      pending = false;
    }
  };
  void beat();
  const timer = setInterval(() => { void beat(); }, 30_000);
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}

export const KAGGLE_STALE_MESSAGE =
  "The notebook run stopped reporting progress and may have been interrupted. Any notebook edits made so far are staged — review them and re-run if needed.";

/** Expire only the exact running version observed by the stale-job reader. */
export async function expireStaleKaggleJob(
  supabase: SupabaseClient,
  job: { id: string; updated_at: string },
) {
  const { data, error } = await supabase.from("coding_jobs")
    .update({ status: "failed", error: KAGGLE_STALE_MESSAGE, finished_at: new Date().toISOString() })
    .eq("id", job.id)
    .eq("job_type", "kaggle")
    .eq("status", "running")
    .eq("updated_at", job.updated_at)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
