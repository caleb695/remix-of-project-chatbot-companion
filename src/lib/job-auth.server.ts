// Server-only. Verifies a runner request against the coding_jobs.hmac_secret bearer.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export async function authJobRequest(request: Request) {
  const jobId = request.headers.get("x-job-id");
  const secret = request.headers.get("x-job-secret");
  if (!jobId || !secret) throw new Response("missing job auth", { status: 401 });
  const sb = adminClient();
  const { data: job, error } = await sb.from("coding_jobs").select("*").eq("id", jobId).maybeSingle();
  if (error || !job) throw new Response("no job", { status: 404 });
  if (job.hmac_secret !== secret) throw new Response("bad secret", { status: 401 });
  return { job, sb };
}
