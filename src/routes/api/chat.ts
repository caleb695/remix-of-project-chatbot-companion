import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, convertToModelMessages, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";

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

        const body = (await request.json()) as { messages: UIMessage[]; threadId: string; repoId: string };
        const { messages, threadId, repoId } = body;
        if (!threadId || !repoId) return new Response("Missing threadId/repoId", { status: 400 });

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

        const tools = {
          list_files: tool({
            description: "List all files in the current working copy of the repository.",
            inputSchema: z.object({}),
            execute: async () => {
              const { data } = await supa
                .from("working_files")
                .select("path, status")
                .eq("repo_selection_id", repoId)
                .order("path");
              return { files: data ?? [] };
            },
          }),
          read_file: tool({
            description: "Read the full text contents of a file at the given path in the working copy.",
            inputSchema: z.object({ path: z.string().describe("File path relative to repo root") }),
            execute: async ({ path }) => {
              const { data } = await supa
                .from("working_files")
                .select("content, status")
                .eq("repo_selection_id", repoId)
                .eq("path", path)
                .maybeSingle();
              if (!data) return { error: "File not found" };
              if (data.status === "deleted") return { error: "File was deleted" };
              return { path, content: data.content ?? "" };
            },
          }),
          write_file: tool({
            description: "Create or overwrite a file with new content. Use this to make edits. Provide the FULL new file content.",
            inputSchema: z.object({
              path: z.string(),
              content: z.string().describe("The complete new file content"),
            }),
            execute: async ({ path, content }) => {
              const { data: existing } = await supa
                .from("working_files")
                .select("id, original_content, original_sha, status")
                .eq("repo_selection_id", repoId)
                .eq("path", path)
                .maybeSingle();
              if (existing) {
                const status = existing.original_content === content ? "unchanged" : "modified";
                await supa.from("working_files").update({ content, status }).eq("id", existing.id);
              } else {
                await supa.from("working_files").insert({
                  repo_selection_id: repoId,
                  user_id: userId,
                  path,
                  content,
                  original_content: null,
                  status: "added",
                });
              }
              return { ok: true, path };
            },
          }),
          delete_file: tool({
            description: "Delete a file from the working copy.",
            inputSchema: z.object({ path: z.string() }),
            execute: async ({ path }) => {
              const { data: existing } = await supa
                .from("working_files")
                .select("id, status")
                .eq("repo_selection_id", repoId)
                .eq("path", path)
                .maybeSingle();
              if (!existing) return { error: "File not found" };
              if (existing.status === "added") {
                await supa.from("working_files").delete().eq("id", existing.id);
              } else {
                await supa.from("working_files").update({ status: "deleted" }).eq("id", existing.id);
              }
              return { ok: true, path };
            },
          }),
        };

        const model = openrouter(modelId);

        const result = streamText({
          model,
          system: `You are a coding assistant with tools to read, write, and delete files in the user's GitHub project (an in-app working copy — nothing is pushed until they commit). Prefer to call list_files first to explore, then read_file for context before write_file. Always write COMPLETE file contents in write_file, never diffs or snippets. Be concise in chat; do real work with tools.`,
          messages: await convertToModelMessages(messages),
          tools,
          stopWhen: stepCountIs(50),
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