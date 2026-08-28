import { createFileRoute } from "@tanstack/react-router";
import { authJobRequest } from "@/lib/job-auth.server";

/**
 * Kaggle notebook source endpoint for the GitHub Actions runner.
 * 
 * GET /api/public/jobs/kaggle?action=get_source - Returns the current working source
 * POST /api/public/jobs/kaggle - Saves the working source (action=save_source)
 * 
 * This runs in the app's authenticated context with the job's HMAC auth.
 */
export const Route = createFileRoute("/api/public/jobs/kaggle")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let ctx;
        try {
          ctx = await authJobRequest(request);
        } catch (r) {
          return r as Response;
        }
        const { job, sb } = ctx;

        const url = new URL(request.url);
        const action = url.searchParams.get("action");

        if (action === "get_source") {
          // Get the notebook from the database
          const { data: nb, error } = await sb
            .from("kaggle_notebooks")
            .select("id, owner, slug, title, language, working_source, original_source, status")
            .eq("id", job.repo_selection_id) // For kaggle jobs, repo_selection_id stores the notebook id
            .maybeSingle();

          if (error || !nb) {
            return new Response(JSON.stringify({ error: "Notebook not found" }), { status: 404 });
          }

          if (!nb.working_source) {
            return new Response(JSON.stringify({ error: "Notebook not synced yet" }), { status: 400 });
          }

          return Response.json({ source: nb.working_source });
        }

        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
      },

      POST: async ({ request }) => {
        let ctx;
        try {
          ctx = await authJobRequest(request);
        } catch (r) {
          return r as Response;
        }
        const { job, sb } = ctx;

        const body = await request.json().catch(() => ({})) as { action?: string; source?: string };

        if (body.action === "save_source" && typeof body.source === "string") {
          // Save the working source to the database
          const { error } = await sb
            .from("kaggle_notebooks")
            .update({
              working_source: body.source,
              status: "modified",
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.repo_selection_id);

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
          }

          return Response.json({ ok: true, bytes: body.source.length });
        }

        return new Response(JSON.stringify({ error: "Invalid action or missing source" }), { status: 400 });
      },
    },
  },
});