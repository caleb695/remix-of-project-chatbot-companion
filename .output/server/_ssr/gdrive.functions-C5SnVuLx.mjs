import { c as createServerFn } from "./createServerFn-BFFE07zL.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-UH_Jp6hR.mjs";
import { At as arrayType, Ft as stringType, Pt as objectType, jt as booleanType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { t as createServerRpc } from "./createServerRpc-MBa5GZ-L.mjs";
import processModule from "node:process";
//#region node_modules/.nitro/vite/services/ssr/assets/gdrive.functions-C5SnVuLx.js
var GATEWAY = "https://connector-gateway.lovable.dev/google_drive/drive/v3";
function gatewayHeaders() {
	const lovableKey = processModule.env["LOVABLE_API_KEY"];
	const driveKey = processModule.env["GOOGLE_DRIVE_API_KEY"];
	if (!lovableKey || !driveKey) throw new Error("Google Drive is not connected to this project.");
	return {
		Authorization: `Bearer ${lovableKey}`,
		"X-Connection-Api-Key": driveKey
	};
}
async function driveFetch(path, init) {
	const res = await fetch(`${GATEWAY}${path}`, {
		...init,
		headers: {
			...gatewayHeaders(),
			...init?.headers ?? {}
		}
	});
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Google Drive request failed [${res.status}]: ${body.slice(0, 400)}`);
	}
	return res;
}
async function mapLimit(items, limit, fn) {
	const results = new Array(items.length);
	let next = 0;
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
		for (;;) {
			const index = next++;
			if (index >= items.length) return;
			results[index] = await fn(items[index]);
		}
	}));
	return results;
}
async function listDriveFiles(q, pageSize = 1e3) {
	const files = [];
	let pageToken;
	do {
		const params = new URLSearchParams({
			q,
			pageSize: String(pageSize),
			orderBy: "folder,name",
			fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime)",
			supportsAllDrives: "true",
			includeItemsFromAllDrives: "true"
		});
		if (pageToken) params.set("pageToken", pageToken);
		const json = await (await driveFetch(`/files?${params.toString()}`)).json();
		files.push(...json.files ?? []);
		pageToken = json.nextPageToken;
	} while (pageToken);
	return files;
}
var FOLDER_MIME = "application/vnd.google-apps.folder";
/** Google-native docs need an export mime type; everything else downloads as-is. */
var EXPORTS = {
	"application/vnd.google-apps.document": {
		mime: "text/markdown",
		ext: ".md"
	},
	"application/vnd.google-apps.spreadsheet": {
		mime: "text/csv",
		ext: ".csv"
	},
	"application/vnd.google-apps.presentation": {
		mime: "text/plain",
		ext: ".txt"
	},
	"application/vnd.google-apps.script": {
		mime: "application/vnd.google-apps.script+json",
		ext: ".json"
	}
};
var listDrive_createServerFn_handler = createServerRpc({
	id: "ca454c81504de2fdb676dc6f7288b373e3db0750e14236c041fb2f4c09fbfe95",
	name: "listDrive",
	filename: "src/lib/gdrive.functions.ts"
}, (opts) => listDrive.__executeServer(opts));
var listDrive = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({
	folderId: stringType().default("root"),
	query: stringType().max(200).optional()
}).parse(i)).handler(listDrive_createServerFn_handler, async ({ data }) => {
	const escaped = data.query?.replace(/'/g, "\\'");
	return (await listDriveFiles(escaped ? `name contains '${escaped}' and trashed = false` : `'${data.folderId.replace(/'/g, "\\'")}' in parents and trashed = false`, 200)).map((f) => ({
		id: f.id,
		name: f.name,
		mimeType: f.mimeType,
		size: f.size ? Number(f.size) : null,
		isFolder: f.mimeType === FOLDER_MIME,
		modifiedTime: f.modifiedTime ?? null
	}));
});
async function listFolderRecursive(folderId, prefix, out, depth = 0) {
	if (depth > 5 || out.length >= 100) return;
	const files = await listDriveFiles(`'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`);
	const folders = [];
	for (const f of files) {
		if (out.length >= 100) return;
		if (f.mimeType === FOLDER_MIME) folders.push({
			id: f.id,
			prefix: `${prefix}${f.name}/`
		});
		else out.push({
			id: f.id,
			name: f.name,
			mimeType: f.mimeType,
			size: f.size ? Number(f.size) : null,
			isFolder: false,
			modifiedTime: f.modifiedTime ?? null,
			path: `${prefix}${f.name}`
		});
	}
	await mapLimit(folders, 4, (folder) => listFolderRecursive(folder.id, folder.prefix, out, depth + 1));
}
var MAX_BYTES = 20 * 1024 * 1024;
/**
* Import Drive files (and whole folders, recursively) into the thread's
* attachments so the agent can use them exactly like a manual upload.
*/
var importFromDrive_createServerFn_handler = createServerRpc({
	id: "d8670f9193f53af4c6ffa94b49ff6ce9a612f2f976783855b1532e4810137447",
	name: "importFromDrive",
	filename: "src/lib/gdrive.functions.ts"
}, (opts) => importFromDrive.__executeServer(opts));
var importFromDrive = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => objectType({
	threadId: stringType().uuid(),
	items: arrayType(objectType({
		id: stringType(),
		name: stringType(),
		isFolder: booleanType()
	})).min(1).max(50)
}).parse(i)).handler(importFromDrive_createServerFn_handler, async ({ context, data }) => {
	const targets = [];
	for (const item of data.items) if (item.isFolder) {
		const files = [];
		await listFolderRecursive(item.id, `${item.name}/`, files);
		for (const f of files) targets.push({
			id: f.id,
			name: f.path,
			mimeType: f.mimeType
		});
	} else targets.push({
		id: item.id,
		name: item.name
	});
	const imported = [];
	const skipped = [];
	await mapLimit(targets.slice(0, 100), 6, async (t) => {
		try {
			let mimeType = t.mimeType;
			if (!mimeType) mimeType = (await (await driveFetch(`/files/${t.id}?fields=mimeType,name,size&supportsAllDrives=true`)).json()).mimeType;
			const exportAs = EXPORTS[mimeType ?? ""];
			const fileRes = await driveFetch(exportAs ? `/files/${t.id}/export?mimeType=${encodeURIComponent(exportAs.mime)}` : `/files/${t.id}?alt=media&supportsAllDrives=true`);
			const buf = new Uint8Array(await fileRes.arrayBuffer());
			if (buf.byteLength > MAX_BYTES) {
				skipped.push({
					name: t.name,
					reason: "larger than 20MB"
				});
				return;
			}
			const finalMime = exportAs ? exportAs.mime : mimeType ?? "application/octet-stream";
			const safe = `${t.name}${exportAs && !t.name.endsWith(exportAs.ext) ? exportAs.ext : ""}`.replace(/[^\w./-]+/g, "_");
			const storagePath = `${context.userId}/${data.threadId}/${Date.now()}-${safe.replace(/\//g, "__")}`;
			const { error: upErr } = await context.supabase.storage.from("attachments").upload(storagePath, buf, {
				contentType: finalMime,
				upsert: true
			});
			if (upErr) throw upErr;
			const { error: rowErr } = await context.supabase.from("chat_attachments").insert({
				user_id: context.userId,
				thread_id: data.threadId,
				name: safe,
				mime_type: finalMime,
				size_bytes: buf.byteLength,
				storage_path: storagePath
			});
			if (rowErr) throw rowErr;
			imported.push(safe);
		} catch (e) {
			skipped.push({
				name: t.name,
				reason: e instanceof Error ? e.message.slice(0, 160) : "failed"
			});
		}
	});
	return {
		imported,
		skipped
	};
});
//#endregion
export { importFromDrive_createServerFn_handler, listDrive_createServerFn_handler };
