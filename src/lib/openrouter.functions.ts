import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getOpenrouterSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("openrouter_settings")
      .select("model, updated_at, api_key, mistral_api_key")
      .maybeSingle();
    if (!data) return null;
    return {
      model: data.model,
      updated_at: data.updated_at,
      has_key: Boolean(data.api_key),
      key_preview: data.api_key ? `${data.api_key.slice(0, 6)}…${data.api_key.slice(-4)}` : null,
      has_mistral_key: Boolean(data.mistral_api_key),
      mistral_key_preview: data.mistral_api_key ? `${data.mistral_api_key.slice(0, 4)}…${data.mistral_api_key.slice(-4)}` : null,
    };
  });

export const saveOpenrouterSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      apiKey: z.string().min(10).max(500).optional(),
      mistralApiKey: z.string().min(10).max(500).optional(),
      model: z.string().min(1).max(200),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    // Load existing row (api_key is NOT NULL, so we must keep it when only updating other fields).
    const { data: existing } = await context.supabase
      .from("openrouter_settings").select("api_key, mistral_api_key").maybeSingle();
    const api_key = data.apiKey ?? existing?.api_key;
    if (!api_key) throw new Error("Add your OpenRouter API key first");
    const mistral_api_key = data.mistralApiKey ?? existing?.mistral_api_key ?? null;
    const { error } = await context.supabase
      .from("openrouter_settings")
      .upsert({ user_id: context.userId, api_key, mistral_api_key, model: data.model });
    if (error) throw error;
    return { ok: true };
  });

export const listOpenrouterModels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("openrouter_settings").select("api_key, mistral_api_key").maybeSingle();
    if (!data?.api_key) throw new Error("Save your OpenRouter API key first");
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${data.api_key}` },
    });
    if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
    const body = await res.json() as { data: Array<{ id: string; name: string; context_length?: number; pricing?: { prompt: string; completion: string } }> };
    const orModels = body.data
      .map((m) => ({
        id: m.id,
        name: m.name,
        context_length: m.context_length,
        pricing: m.pricing,
      }));

    // Also list Mistral models directly (used for coding/chat via the user's Mistral key).
    // We prefix the id with `mistral:` so the chat + runner route it to api.mistral.ai instead of OpenRouter.
    let mistralModels: typeof orModels = [];
    if (data.mistral_api_key) {
      try {
        const mr = await fetch("https://api.mistral.ai/v1/models", {
          headers: { Authorization: `Bearer ${data.mistral_api_key}` },
        });
        if (mr.ok) {
          const mb = await mr.json() as { data: Array<{ id: string }> };
          mistralModels = mb.data
            // Skip pure embedding models — those aren't for chat/coding.
            .filter((m) => !/embed/i.test(m.id))
            .map((m) => ({
              id: `mistral:${m.id}`,
              name: `Mistral · ${m.id}`,
              context_length: undefined,
              pricing: undefined,
            }));
        }
      } catch { /* ignore — mistral listing is best-effort */ }
    }

    return [...mistralModels, ...orModels].sort((a, b) => a.name.localeCompare(b.name));
  });