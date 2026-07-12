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
          .from("openrouter_settings").select("api_key, model").maybeSingle();
        if (!settings?.api_key) {
          return new Response("Add your OpenRouter API key on the Account tab first.", { status: 400 });
        }
        const modelId = thread.model || settings.model;

        // Persist the latest user message immediately
        const lastUser = messages[messages.length - 1];
        if (lastUser?.role === "user") {
          await supa.from("chat_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            parts: lastUser.parts as unknown as object,
          });
          // Auto-title first message
          if (thread.title === "New chat") {
            const text = lastUser.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join(" ")
              .trim()
              .slice(0, 60);
            if (text) await supa.from("chat_threads").update({ title: text }).eq("id", threadId);
          }
        }

        const openrouter = createOpenAICompatible({
          name: "openrouter",
          baseURL: "https://openrouter.ai/api/v1",
          headers: {
            Authorization: `Bearer ${settings.api_key}`,
            "HTTP-Referer": new URL(request.url).origin,
            "X-Title": "Coderbot",
          },
        });

        const model = openrouter(modelId);

        const result = streamText({
          model,
          system: `You are a helpful coding assistant. Discuss the user's repository and plan changes. When the user is ready to apply edits, tell them to click "Run coding job" — that runs an autonomous agent in their GitHub Actions that reads/writes files and pushes the commit for them. Do not pretend to edit files here; you have no file-editing tools in chat.`,
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