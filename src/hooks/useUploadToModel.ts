// Example: replace this with your existing upload logic.
// The example posts each file to /api/upload as multipart/form-data and includes path metadata.
// Keep this outside the supabase folder as requested.

export function useUploadToModel() {
  async function uploadFileToModel(file: File, path: string) {
    const fd = new FormData();
    fd.append("file", file, file.name);
    fd.append("path", path);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Upload failed: ${res.status} ${res.statusText} ${text}`);
    }
    return await res.json();
  }

  return { uploadFileToModel };
}
