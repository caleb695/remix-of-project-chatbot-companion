import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, convertToModelMessages, type UIMessage } from "ai";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const token = auth.slice(7);

        const { createClient } = await import("@supabase/supabase-js");
        const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
        });
        const { data: userData, error: uerr } = await supa.auth.getUser(token);
        if (uerr || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const body = (await request.json()) as { messages: UIMessage[]; threadId: string; repoId?: string };
        const { messages, threadId } = body;
        if (!threadId) return new Response("Missing threadId", { status: 400 });

        // Verify ownership of thread + repo
        const { data: thread } = await supa
          .from("chat_threads").select("id, title, model, repo_selection_id").eq("id", threadId).maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });

        const { data: settings } = await supa
          .from("openrouter_settings")
          .select("api_key, model, mistral_api_key, groq_api_key, nvidia_api_key, embedding_provider, embedding_model")
          .maybeSingle();
        if (!settings) return new Response("Add an AI provider key on the Account tab first.", { status: 400 });
        const modelId = thread.model || settings.model;

        // Persist the latest user message immediately
        const lastUser = messages[messages.length - 1];
        const lastUserText = lastUser?.role === "user"
          ? lastUser.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").trim()
          : "";
        if (lastUser?.role === "user") {
          await supa.from("chat_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            parts: lastUser.parts as unknown as object,
          });
          // Auto-title first message
          if (thread.title === "New chat") {
            const text = lastUserText.slice(0, 60);
            if (text) await supa.from("chat_threads").update({ title: text }).eq("id", threadId);
          }
        }

        // Build repo RAG context (semantic search over indexed chunks)
        let ragContext = "";
        const embeddingKey = settings.embedding_provider === "mistral" ? settings.mistral_api_key
          : settings.embedding_provider === "nvidia" ? settings.nvidia_api_key
          : settings.api_key;
        const embeddingUrl = settings.embedding_provider === "mistral" ? "https://api.mistral.ai/v1/embeddings"
          : settings.embedding_provider === "nvidia" ? "https://integrate.api.nvidia.com/v1/embeddings"
          : "https://openrouter.ai/api/v1/embeddings";
        if (thread.repo_selection_id && embeddingKey && lastUserText) {
          try {
            const embRes = await fetch(embeddingUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${embeddingKey}` },
              body: JSON.stringify({ model: settings.embedding_model, input: [lastUserText.slice(0, 4000)] }),
            });
            if (embRes.ok) {
              const embBody = await embRes.json() as { data: { embedding: number[] }[] };
              const vec = embBody.data[0]?.embedding;
              if (vec) {
                const { data: hits } = await supa.rpc("match_repo_chunks", {
                  p_repo_selection_id: thread.repo_selection_id,
                  p_query: vec as unknown as string,
                  p_match_count: 8,
                });
                if (hits?.length) {
                  ragContext = "Relevant repo code (semantic search):\n\n" +
                    hits.map((h: { path: string; content: string }) =>
                      `--- ${h.path} ---\n${(h.content ?? "").slice(0, 1200)}`).join("\n\n");
                }
              }
            }
          } catch { /* best-effort */ }

          // Repo tree outline (paths + short summaries) if not too many
          const { data: files } = await supa.from("repo_files")
            .select("path, summary").eq("repo_selection_id", thread.repo_selection_id).limit(400);
          if (files?.length) {
            const outline = files.map((f) => f.summary ? `${f.path} — ${f.summary}` : f.path).join("\n").slice(0, 8000);
            ragContext = `Repository file outline:\n${outline}\n\n${ragContext}`;
          }
        }

        const route = modelId.startsWith("mistral:")
          ? { name: "mistral", prefix: "mistral:", baseURL: "https://api.mistral.ai/v1", key: settings.mistral_api_key }
          : modelId.startsWith("groq:")
            ? { name: "groq", prefix: "groq:", baseURL: "https://api.groq.com/openai/v1", key: settings.groq_api_key }
            : modelId.startsWith("nvidia:")
              ? { name: "nvidia", prefix: "nvidia:", baseURL: "https://integrate.api.nvidia.com/v1", key: settings.nvidia_api_key }
              : { name: "openrouter", prefix: "", baseURL: "https://openrouter.ai/api/v1", key: settings.api_key };
        if (!route.key) return new Response(`Add your ${route.name} API key on the Account tab.`, { status: 400 });
        const provider = createOpenAICompatible({
          name: route.name, baseURL: route.baseURL,
          headers: { Authorization: `Bearer ${route.key}`,
            ...(route.name === "openrouter" ? { "HTTP-Referer": new URL(request.url).origin, "X-Title": "Coderbot" } : {}) },
        });
        const model = provider(modelId.slice(route.prefix.length));

        const systemPrompt =
          `You are a helpful coding assistant. Discuss the user's repository and plan changes. When the user is ready to apply edits, tell them to click "Run coding job" — that runs an autonomous agent in their GitHub Actions that reads/writes files and pushes the commit for them. Do not pretend to edit files here; you have no file-editing tools in chat.` +
          (ragContext ? `\n\n${ragContext}` : "");

        const result = streamText({
          model,
          system: systemPrompt,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            const assistant = finalMessages[finalMessages.length - 1];
            if (assistant?.role === "assistant") {
              await supa.from("chat_messages").insert({
                thread_id: threadId,
                user_id: userId,
                role: "assistant",
                parts: assistant.parts as unknown as object,
              });
              await supa.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
            }
          },
        });
      },
    },
  },
});