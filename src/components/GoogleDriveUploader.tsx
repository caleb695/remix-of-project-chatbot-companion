import React, { useEffect, useMemo, useRef, useState } from "react";
import { useUploadToModel } from "@/hooks/useUploadToModel";

export default function GoogleDriveUploader() {
  const { uploadFileToModel } = useUploadToModel();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [folderInput, setFolderInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const runningRef = useRef(false);
  const clientRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const client = await import("@/lib/googleDriveClient");
        clientRef.current = client;
        try {
          await client.initGoogleIdentity();
          if (mounted) setReady(true);
        } catch (err: any) {
          if (mounted) {
            setReady(false);
            setStatus(err?.message ?? String(err));
          }
        }
      } catch (err: any) {
        if (mounted) setStatus(`Failed to load Google client: ${err?.message ?? String(err)}`);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const folderId = useMemo(() => {
    try {
      if (!folderInput) return "";
      const u = new URL(folderInput);
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("folders");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    } catch (e) {
      // not a url, treat as raw id
    }
    return folderInput.trim();
  }, [folderInput]);

  async function handleSignIn() {
    setStatus(null);
    try {
      if (!clientRef.current) throw new Error("Google client not initialized");
      await clientRef.current.requestAccessTokenPopup();
      setSignedIn(true);
    } catch (e: any) {
      setStatus(`Sign-in failed: ${e?.message ?? String(e)}`);
    }
  }

  async function handleStart() {
    if (!folderId) {
      setStatus("Please enter a Drive folder URL or ID.");
      return;
    }
    if (runningRef.current) return;
    setStatus("Listing files...");
    setProgress({ done: 0, total: 0 });
    runningRef.current = true;
    try {
      if (!clientRef.current) throw new Error("Google client not initialized");
      const token = clientRef.current.getAccessToken();
      if (!token) throw new Error("Not signed in (no access token)");
      let uploaded = 0;
      const wrapped = async (file: File, path: string) => {
        await uploadFileToModel(file, path);
        uploaded += 1;
        setProgress((p) => ({ done: uploaded, total: p?.total ?? uploaded }));
      };
      setStatus("Uploading... this may take a while for large folders.");
      const result = await clientRef.current.uploadDriveFolderToModel(folderId, wrapped, { concurrency: 3 });
      if (result && result.success) {
        setStatus(`Done — uploaded ${result.fileCount ?? "?"} files.`);
      } else {
        setStatus(`Completed with errors.`);
        console.warn("Drive upload result", result);
      }
    } catch (e: any) {
      console.error(e);
      setStatus(`Upload failed: ${e?.message ?? String(e)}`);
    } finally {
      runningRef.current = false;
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Google Drive uploader</div>
          <div className="text-xs text-muted-foreground">Sign in and paste a Drive folder URL or ID to upload its contents.</div>
        </div>
        <div>
          <button
            className="inline-flex items-center rounded-md border px-3 py-1 text-sm"
            onClick={handleSignIn}
            disabled={!ready}
            type="button"
          >
            {signedIn ? "Signed in" : "Sign in with Google (popup)"}
          </button>
        </div>
      </div>

      <div>
        <input
          value={folderInput}
          onChange={(e) => setFolderInput(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/<FOLDER_ID> or folder id"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <button className="inline-flex items-center rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground" onClick={handleStart} type="button">
          Start upload
        </button>
        <div className="text-xs text-muted-foreground">{status}</div>
      </div>

      {progress && (
        <div className="text-sm text-muted-foreground">{progress.done} / {progress.total} files</div>
      )}
    </div>
  );
}
