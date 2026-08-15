import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getOpenrouterSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("openrouter_settings")
      .select("model, updated_at, api_key, mistral_api_key, groq_api_key, nvidia_api_key, embedding_provider, embedding_model")
      .maybeSingle();
    if (!data) return null;
    return {
      model: data.model,
      updated_at: data.updated_at,
      has_key: Boolean(data.api_key),
      key_preview: data.api_key ? `${data.api_key.slice(0, 6)}…${data.api_key.slice(-4)}` : null,
      has_mistral_key: Boolean(data.mistral_api_key),
      mistral_key_preview: data.mistral_api_key ? `${data.mistral_api_key.slice(0, 4)}…${data.mistral_api_key.slice(-4)}` : null,
      has_groq_key: Boolean(data.groq_api_key),
      groq_key_preview: data.groq_api_key ? `${data.groq_api_key.slice(0, 4)}…${data.groq_api_key.slice(-4)}` : null,
      has_nvidia_key: Boolean(data.nvidia_api_key),
      nvidia_key_preview: data.nvidia_api_key ? `${data.nvidia_api_key.slice(0, 4)}…${data.nvidia_api_key.slice(-4)}` : null,
      embedding_provider: data.embedding_provider,
      embedding_model: data.embedding_model,
    };
  });

export const saveOpenrouterSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({
      apiKey: z.string().min(10).max(500).optional(),
      mistralApiKey: z.string().min(10).max(500).optional(),
      groqApiKey: z.string().min(10).max(500).optional(),
      nvidiaApiKey: z.string().min(10).max(500).optional(),
      embeddingProvider: z.enum(["mistral", "openrouter", "nvidia"]),
      embeddingModel: z.string().min(1).max(200),
      model: z.string().min(1).max(200),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: existing } = await context.supabase
      .from("openrouter_settings").select("api_key, mistral_api_key, groq_api_key, nvidia_api_key").maybeSingle();
    const api_key = data.apiKey ?? existing?.api_key ?? null;
    const mistral_api_key = data.mistralApiKey ?? existing?.mistral_api_key ?? null;
    const groq_api_key = data.groqApiKey ?? existing?.groq_api_key ?? null;
    const nvidia_api_key = data.nvidiaApiKey ?? existing?.nvidia_api_key ?? null;
    if (!api_key && !mistral_api_key && !groq_api_key && !nvidia_api_key) throw new Error("Add at least one provider API key");
    const { error } = await context.supabase
      .from("openrouter_settings")
      .upsert({ user_id: context.userId, api_key, mistral_api_key, groq_api_key, nvidia_api_key, model: data.model,
        embedding_provider: data.embeddingProvider, embedding_model: data.embeddingModel });
    if (error) throw error;
    return { ok: true };
  });

export const listOpenrouterModels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("openrouter_settings").select("api_key, mistral_api_key, groq_api_key, nvidia_api_key").maybeSingle();
    if (!data || (!data.api_key && !data.mistral_api_key && !data.groq_api_key && !data.nvidia_api_key)) {
      throw new Error("Save at least one provider API key first");
    }
    type Model = { id: string; name: string; context_length?: number; pricing?: { prompt: string; completion: string } };
    const providers = [
      data.api_key ? { label: "OpenRouter", prefix: "", url: "https://openrouter.ai/api/v1/models", key: data.api_key } : null,
      data.mistral_api_key ? { label: "Mistral", prefix: "mistral:", url: "https://api.mistral.ai/v1/models", key: data.mistral_api_key } : null,
      data.groq_api_key ? { label: "Groq", prefix: "groq:", url: "https://api.groq.com/openai/v1/models", key: data.groq_api_key } : null,
      data.nvidia_api_key ? { label: "NVIDIA NIM", prefix: "nvidia:", url: "https://integrate.api.nvidia.com/v1/models", key: data.nvidia_api_key } : null,
    ].filter((p): p is NonNullable<typeof p> => Boolean(p));
    const batches = await Promise.all(providers.map(async (p) => {
      try {
        const res = await fetch(p.url, { headers: { Authorization: `Bearer ${p.key}` } });
        if (!res.ok) return [] as Model[];
        const body = await res.json() as { data?: Array<{ id: string; name?: string; context_length?: number; pricing?: Model["pricing"] }> };
        return (body.data ?? []).filter((m) => !/embed|rerank/i.test(m.id)).map((m) => ({
          id: `${p.prefix}${m.id}`, name: `${p.label} · ${m.name ?? m.id}`,
          context_length: m.context_length, pricing: m.pricing,
        }));
      } catch { return [] as Model[]; }
    }));
    return batches.flat().sort((a, b) => a.name.localeCompare(b.name));
  });