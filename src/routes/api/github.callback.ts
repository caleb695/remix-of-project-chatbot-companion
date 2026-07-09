import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/github/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (!code || !state) return new Response("Missing code/state", { status: 400 });

        try {
          const { verifyState } = await import("@/lib/oauth-state.server");
          const payload = verifyState(state);
          const uid = payload.uid as string;
          if (!uid) throw new Error("No user id in state");

          const clientId = process.env.GITHUB_CLIENT_ID;
          const clientSecret = process.env.GITHUB_CLIENT_SECRET;
          if (!clientId || !clientSecret) {
            return new Response("GitHub OAuth not configured", { status: 500 });
          }

          const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              client_id: clientId,
              client_secret: clientSecret,
              code,
              redirect_uri: `${url.protocol}//${url.host}/api/github/callback`,
            }),
          });
          const tok = (await tokenRes.json()) as {
            access_token?: string;
            scope?: string;
            error?: string;
            error_description?: string;
          };
          if (!tok.access_token) {
            return new Response(`GitHub token exchange failed: ${tok.error_description ?? tok.error ?? "unknown"}`, { status: 400 });
          }

          const userRes = await fetch("https://api.github.com/user", {
            headers: {
              Authorization: `Bearer ${tok.access_token}`,
              Accept: "application/vnd.github+json",
              "User-Agent": "coderbot-app",
            },
          });
          const gu = (await userRes.json()) as { id: number; login: string; avatar_url: string };

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error } = await supabaseAdmin.from("github_connections").upsert({
            user_id: uid,
            github_user_id: gu.id,
            github_login: gu.login,
            avatar_url: gu.avatar_url,
            access_token: tok.access_token,
            scope: tok.scope ?? null,
          }, { onConflict: "user_id" });
          if (error) throw error;

          return new Response(null, {
            status: 302,
            headers: { Location: "/repos?connected=1" },
          });
        } catch (err) {
          console.error("github callback error", err);
          const msg = err instanceof Error ? err.message : String(err);
          return new Response(`OAuth error: ${msg}`, { status: 400 });
        }
      },
    },
  },
});