import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const subAgentSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().min(1).max(60),
  model: z.string().min(1).max(200),
  instructions: z.string().max(2000).optional(),
});

export const getSubAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ threadId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase
      .from("chat_threads").select("sub_agents").eq("id", data.threadId).maybeSingle();
    const list = Array.isArray(row?.sub_agents) ? row!.sub_agents : [];
    return list as Array<z.infer<typeof subAgentSchema>>;
  });

export const setSubAgents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z.object({ threadId: z.string().uuid(), subAgents: z.array(subAgentSchema).max(20) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("chat_threads")
      .update({ sub_agents: data.subAgents })
      .eq("id", data.threadId);
    if (error) throw error;
    return { ok: true };
  });