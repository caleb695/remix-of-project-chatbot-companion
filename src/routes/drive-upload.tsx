import { createFileRoute } from "@tanstack/react-router";
import React, { Suspense, useEffect, useState } from "react";

const GoogleDriveUploader = React.lazy(() => import("../components/GoogleDriveUploader"));

export const Route = createFileRoute("/drive-upload")({
  head: () => ({
    meta: [
      { title: "Google Drive Upload — Lovable" },
      { name: "description", content: "Upload a Google Drive folder into Lovable." },
    ],
  }),
  component: DriveUploadPage,
});

function DriveUploadPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Upload from Google Drive</h1>
      <p className="text-sm text-muted-foreground mb-4">Use this page to sign in with Google and upload a whole Drive folder (recursively).</p>
      {mounted ? (
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading uploader…</div>}>
          <GoogleDriveUploader />
        </Suspense>
      ) : (
        <div className="text-sm text-muted-foreground">Loading…</div>
      )}
    </div>
  );
}
