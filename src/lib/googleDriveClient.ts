// Lightweight Google Drive client helpers using Google Identity Services (popup OAuth).
// Usage:
//  - call initGoogleIdentity() once on app startup
//  - call requestAccessTokenPopup() to prompt sign-in with a popup
//  - call getAccessToken() to get the current access token
//  - call uploadDriveFolderToModel(folderId, uploadFileToModel, options)
// Notes:
//  - Exports Google Docs to PDF by default. Change exportMimeMap if you want HTML or plain text.
//  - Requires REACT_APP_GOOGLE_CLIENT_ID in env and the script <script src="https://accounts.google.com/gsi/client" async defer></script> in index.html.

export type DriveFileMeta = {
  id: string;
  name: string;
  mimeType: string;
  path: string; // computed path from chosen root
};

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID ?? "";
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

let tokenClient: any = null;
let accessToken: string | null = null;
let accessTokenExpiresAt: number | null = null;

function ensureClientInitialized() {
  if (!CLIENT_ID) throw new Error("REACT_APP_GOOGLE_CLIENT_ID is not set");
  if (!(window as any).google) {
    throw new Error("Google Identity Services not loaded. Add <script src=\"https://accounts.google.com/gsi/client\" async defer></script> to index.html");
  }
  if (!tokenClient) {
    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        // response: {access_token, expires_in, scope, token_type}
        if (response.access_token) {
          accessToken = response.access_token;
          accessTokenExpiresAt = Date.now() + (response.expires_in || 3600) * 1000;
        }
      },
    });
  }
}

export async function initGoogleIdentity(): Promise<void> {
  // no-op other than verifying CLIENT_ID and presence of google
  return new Promise((resolve, reject) => {
    try {
      ensureClientInitialized();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

export async function requestAccessTokenPopup(): Promise<string> {
  ensureClientInitialized();
  return new Promise((resolve, reject) => {
    // set up a temporary callback to capture the token for this request
    const prevCallback = tokenClient.callback;
    tokenClient.callback = (resp: any) => {
      // restore
      tokenClient.callback = prevCallback;
      if (resp.error) {
        reject(new Error(resp.error));
        return;
      }
      if (resp.access_token) {
        accessToken = resp.access_token;
        accessTokenExpiresAt = Date.now() + (resp.expires_in || 3600) * 1000;
        resolve(accessToken);
        return;
      }
      reject(new Error('No access token returned'));
    };

    try {
      // prompt=consent forces a popup consent dialog. If the user already consented it may still show an account chooser.
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      // restore callback on error
      tokenClient.callback = prevCallback;
      reject(err);
    }
  });
}

export function getAccessToken(): string | null {
  if (!accessToken) return null;
  if (accessTokenExpiresAt && Date.now() > accessTokenExpiresAt - 60000) {
    // token is about to expire (within 60s) - we could optionally refresh silently
    // For simplicity, require calling requestAccessTokenPopup again to refresh.
    return accessToken;
  }
  return accessToken;
}

/*
 Recursively list folder contents. Returns a flat array of file metadata with computed path.
 rootFolderId - ID of folder selected
 rootName - label to use as the root path (optional)
*/
export async function listFolderRecursive(
  rootFolderId: string,
  accessTokenParam: string,
  rootName = ""
): Promise<DriveFileMeta[]> {
  const results: DriveFileMeta[] = [];

  async function listChildren(parentId: string, currentPath: string) {
    let pageToken: string | undefined = undefined;
    do {
      const q = `'${parentId}' in parents and trashed=false`;
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.set('q', q);
      url.searchParams.set('fields', 'nextPageToken, files(id, name, mimeType)');
      url.searchParams.set('pageSize', '1000');
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessTokenParam}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Drive list failed: ${res.status} ${res.statusText} ${text}`);
      }
      const json = await res.json();
      for (const f of json.files) {
        const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
        const filePath = currentPath ? `${currentPath}/${f.name}` : f.name;
        if (isFolder) {
          await listChildren(f.id, filePath);
        } else {
          results.push({ id: f.id, name: f.name, mimeType: f.mimeType, path: filePath });
        }
      }
      pageToken = json.nextPageToken;
    } while (pageToken);
  }

  const startPath = rootName ?? '';
  await listChildren(rootFolderId, startPath);
  return results;
}

/*
 Map common Google native types to an export mimeType.
 By default we export docs/spreadsheets/presentations to PDF. You can change this to text/html if needed.
*/
const exportMimeMap: Record<string, string> = {
  'application/vnd.google-apps.document': 'application/pdf',
  'application/vnd.google-apps.spreadsheet': 'application/pdf',
  'application/vnd.google-apps.presentation': 'application/pdf',
};

export async function downloadDriveFileAsFile(fileMeta: DriveFileMeta, accessTokenParam: string): Promise<File> {
  const isGoogleNative = fileMeta.mimeType.startsWith('application/vnd.google-apps');
  let downloadUrl: string;
  if (isGoogleNative) {
    const exportMime = exportMimeMap[fileMeta.mimeType] ?? 'application/pdf';
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileMeta.id}/export?mimeType=${encodeURIComponent(
      exportMime
    )}`;
  } else {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileMeta.id}?alt=media`;
  }

  const res = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${accessTokenParam}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Download failed for ${fileMeta.name}: ${res.status} ${res.statusText} ${text}`);
  }
  const blob = await res.blob();
  let fileName = fileMeta.name;
  if (isGoogleNative) {
    const exportMime = exportMimeMap[fileMeta.mimeType] ?? 'application/pdf';
    if (exportMime === 'application/pdf' && !fileName.toLowerCase().endsWith('.pdf')) {
      fileName = `${fileName}.pdf`;
    }
  }
  return new File([blob], fileName, { type: blob.type });
}

/*
 Orchestrator:
  - folderId: Drive folder id
  - uploadFileToModel: async callback (file: File, path: string) => void
  - options: concurrency, rootName
*/
export async function uploadDriveFolderToModel(
  folderId: string,
  uploadFileToModel: (file: File, path: string) => Promise<void>,
  options?: { concurrency?: number; rootName?: string }
) {
  const concurrency = options?.concurrency ?? 3;
  const token = getAccessToken();
  if (!token) throw new Error('No access token - call requestAccessTokenPopup() first');

  const files = await listFolderRecursive(folderId, token, options?.rootName);

  let index = 0;
  const errors: Array<{ meta: DriveFileMeta; error: any }> = [];

  async function worker() {
    while (true) {
      const i = index++;
      if (i >= files.length) return;
      const meta = files[i];
      try {
        const file = await downloadDriveFileAsFile(meta, token);
        await uploadFileToModel(file, meta.path);
      } catch (err) {
        errors.push({ meta, error: err });
        console.error('Error uploading file', meta, err);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }).map(() => worker()));

  if (errors.length) {
    const msg = `Uploaded with ${errors.length} errors. Check console for details.`;
    console.warn(msg, errors);
    return { success: false, errors };
  }
  return { success: true, fileCount: files.length };
}
