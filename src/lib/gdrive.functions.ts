import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive/drive/v3";

function gatewayHeaders() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const driveKey = process.env["GOOGLE_DRIVE_API_KEY"];
  if (!lovableKey || !driveKey) throw new Error("Google Drive is not connected to this project.");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": driveKey,
  } as Record<string, string>;
}

async function driveFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${GATEWAY}${path}`, { ...init, headers: { ...gatewayHeaders(), ...(init?.headers ?? {}) } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Drive request failed [${res.status}]: ${body.slice(0, 400)}`);
  }
  return res;
}

const FOLDER_MIME = "application/vnd.google-apps.folder";

/** Google-native docs need an export mime type; everything else downloads as-is. */
const EXPORTS: Record<string, { mime: string; ext: string }> = {
  "application/vnd.google-apps.document": { mime: "text/markdown", ext: ".md" },
  "application/vnd.google-apps.spreadsheet": { mime: "text/csv", ext: ".csv" },
  "application/vnd.google-apps.presentation": { mime: "text/plain", ext: ".txt" },
  "application/vnd.google-apps.script": { mime: "application/vnd.google-apps.script+json", ext: ".json" },
};

export type DriveEntry = {
  id: string; name: string; mimeType: string; size: number | null; isFolder: boolean; modifiedTime: string | null;
};

/** Browse a Drive folder (or search across the whole Drive when `query` is set). */
export const listDrive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ folderId: z.string().default("root"), query: z.string().max(200).optional() }).parse(i),
  )
  .handler(async ({ data }): Promise<DriveEntry[]> => {
    const escaped = data.query?.replace(/'/g, "\\'");
    const q = escaped
      ? `name contains '${escaped}' and trashed = false`
      : `'${data.folderId.replace(/'/g, "\\'")}' in parents and trashed = false`;
    const params = new URLSearchParams({
      q,
      pageSize: "200",
      orderBy: "folder,name",
      fields: "files(id,name,mimeType,size,modifiedTime)",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    const res = await driveFetch(`/files?${params.toString()}`);
    const json = (await res.json()) as { files?: Array<Record<string, string>> };
    return (json.files ?? []).map((f) => ({
      id: f.id!,
      name: f.name!,
      mimeType: f.mimeType!,
      size: f.size ? Number(f.size) : null,
      isFolder: f.mimeType === FOLDER_MIME,
      modifiedTime: f.modifiedTime ?? null,
    }));
  });

async function listFolderRecursive(folderId: string, prefix: string, out: Array<DriveEntry & { path: string }>, depth = 0) {
  if (depth > 5 || out.length >= 100) return;
  const params = new URLSearchParams({
    q: `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`,
    pageSize: "200",
    fields: "files(id,name,mimeType,size,modifiedTime)",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const res = await driveFetch(`/files?${params.toString()}`);
  const json = (await res.json()) as { files?: Array<Record<string, string>> };
  for (const f of json.files ?? []) {
    if (out.length >= 100) return;
    if (f.mimeType === FOLDER_MIME) {
      await listFolderRecursive(f.id!, `${prefix}${f.name}/`, out, depth + 1);
    } else {
      out.push({
        id: f.id!, name: f.name!, mimeType: f.mimeType!, size: f.size ? Number(f.size) : null,
        isFolder: false, modifiedTime: f.modifiedTime ?? null, path: `${prefix}${f.name}`,
      });
    }
  }
}

const MAX_BYTES = 20 * 1024 * 1024;

/**
 * Import Drive files (and whole folders, recursively) into the thread's
 * attachments so the agent can use them exactly like a manual upload.
 */
export const importFromDrive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      threadId: z.string().uuid(),
      items: z.array(z.object({ id: z.string(), name: z.string(), isFolder: z.boolean() })).min(1).max(50),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const targets: Array<{ id: string; name: string; mimeType?: string }> = [];
    for (const item of data.items) {
      if (item.isFolder) {
        const files: Array<DriveEntry & { path: string }> = [];
        await listFolderRecursive(item.id, `${item.name}/`, files);
        for (const f of files) targets.push({ id: f.id, name: f.path, mimeType: f.mimeType });
      } else {
        targets.push({ id: item.id, name: item.name });
      }
    }

    const imported: string[] = [];
    const skipped: Array<{ name: string; reason: string }> = [];

    for (const t of targets.slice(0, 100)) {
      try {
        let mimeType = t.mimeType;
        if (!mimeType) {
          const metaRes = await driveFetch(`/files/${t.id}?fields=mimeType,name,size&supportsAllDrives=true`);
          const meta = (await metaRes.json()) as { mimeType: string };
          mimeType = meta.mimeType;
        }
        const exportAs = EXPORTS[mimeType ?? ""];
        const url = exportAs
          ? `/files/${t.id}/export?mimeType=${encodeURIComponent(exportAs.mime)}`
          : `/files/${t.id}?alt=media&supportsAllDrives=true`;
        const fileRes = await driveFetch(url);
        const buf = new Uint8Array(await fileRes.arrayBuffer());
        if (buf.byteLength > MAX_BYTES) {
          skipped.push({ name: t.name, reason: "larger than 20MB" });
          continue;
        }
        const finalMime = exportAs ? exportAs.mime : (mimeType ?? "application/octet-stream");
        const safe = `${t.name}${exportAs && !t.name.endsWith(exportAs.ext) ? exportAs.ext : ""}`
          .replace(/[^\w./\-]+/g, "_");
        const storagePath = `${context.userId}/${data.threadId}/${Date.now()}-${safe.replace(/\//g, "__")}`;
        const { error: upErr } = await context.supabase.storage
          .from("attachments")
          .upload(storagePath, buf, { contentType: finalMime, upsert: true });
        if (upErr) throw upErr;
        const { error: rowErr } = await context.supabase.from("chat_attachments").insert({
          user_id: context.userId,
          thread_id: data.threadId,
          name: safe,
          mime_type: finalMime,
          size_bytes: buf.byteLength,
          storage_path: storagePath,
        });
        if (rowErr) throw rowErr;
        imported.push(safe);
      } catch (e) {
        skipped.push({ name: t.name, reason: e instanceof Error ? e.message.slice(0, 160) : "failed" });
      }
    }

    return { imported, skipped };
  });
