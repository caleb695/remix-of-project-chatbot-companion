import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import GoogleDriveUploader from "../components/GoogleDriveUploader";

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
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Upload from Google Drive</h1>
      <p className="text-sm text-muted-foreground mb-4">Use this page to sign in with Google and upload a whole Drive folder (recursively).</p>
      <GoogleDriveUploader />
    </div>
  );
}
