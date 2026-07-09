import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getOpenrouterSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("openrouter_settings")
      .select("model, updated_at, api_key")
      .maybeSingle();
    if (!data) return null;
    return {
      model: data.model,
      updated_at: data.updated_at,
      has_key: Boolean(data.api_key),
      key_preview: data.api_key ? `${data.api_key.slice(0, 6)}…${data.api_key.slice(-4)}` : null,
    };
  });

export const saveOpenrouterSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      apiKey: z.string().min(10).max(500).optional(),
      model: z.string().min(1).max(200),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    if (data.apiKey) {
      const { error } = await context.supabase
        .from("openrouter_settings")
        .upsert({ user_id: context.userId, api_key: data.apiKey, model: data.model });
      if (error) throw error;
    } else {
      const { error } = await context.supabase
        .from("openrouter_settings")
        .update({ model: data.model })
        .eq("user_id", context.userId);
      if (error) throw error;
    }
    return { ok: true };
  });

export const listOpenrouterModels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("openrouter_settings").select("api_key").maybeSingle();
    if (!data?.api_key) throw new Error("Save your OpenRouter API key first");
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${data.api_key}` },
    });
    if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
    const body = await res.json() as { data: Array<{ id: string; name: string; context_length?: number; pricing?: { prompt: string; completion: string } }> };
    return body.data
      .map((m) => ({
        id: m.id,
        name: m.name,
        context_length: m.context_length,
        pricing: m.pricing,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });