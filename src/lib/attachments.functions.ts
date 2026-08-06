import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listAttachments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ threadId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("chat_attachments")
      .select("id, name, mime_type, size_bytes, code_only, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at");
    if (error) throw error;
    return rows ?? [];
  });

/** Record an upload the client already pushed into the private `attachments` bucket. */
export const registerAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      threadId: z.string().uuid(),
      name: z.string().min(1).max(200),
      mimeType: z.string().max(200).optional(),
      sizeBytes: z.number().int().nonnegative().optional(),
      storagePath: z.string().min(1).max(400),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    if (!data.storagePath.startsWith(`${context.userId}/`)) throw new Error("Invalid upload path");
    const { data: row, error } = await context.supabase
      .from("chat_attachments")
      .insert({
        user_id: context.userId,
        thread_id: data.threadId,
        name: data.name,
        mime_type: data.mimeType ?? null,
        size_bytes: data.sizeBytes ?? null,
        storage_path: data.storagePath,
      })
      .select("id, name, mime_type, size_bytes, code_only, created_at")
      .single();
    if (error) throw error;
    return row;
  });

/** code_only = the agent may use the file from code but never reads its contents. */
export const setAttachmentCodeOnly = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), codeOnly: z.boolean() }).parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("chat_attachments").update({ code_only: data.codeOnly }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase
      .from("chat_attachments").select("storage_path").eq("id", data.id).maybeSingle();
    if (row) await context.supabase.storage.from("attachments").remove([row.storage_path]);
    const { error } = await context.supabase.from("chat_attachments").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });