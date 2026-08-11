import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight, Folder, FileText, Loader2, HardDrive, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { listDrive, importFromDrive, type DriveEntry } from "@/lib/gdrive.functions";

type Crumb = { id: string; name: string };

export function DrivePicker({
  open, onOpenChange, threadId, onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  threadId: string;
  onImported: () => void;
}) {
  const listFn = useServerFn(listDrive);
  const importFn = useServerFn(importFromDrive);
  const [crumbs, setCrumbs] = useState<Crumb[]>([{ id: "root", name: "My Drive" }]);
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<Record<string, DriveEntry>>({});

  const current = crumbs[crumbs.length - 1];
  const entries = useQuery({
    queryKey: ["drive", current.id, term],
    queryFn: () => listFn({ data: { folderId: current.id, query: term || undefined } }),
    enabled: open,
  });

  const doImport = useMutation({
    mutationFn: () =>
      importFn({
        data: {
          threadId,
          items: Object.values(selected).map((e) => ({ id: e.id, name: e.name, isFolder: e.isFolder })),
        },
      }),
    onSuccess: (res) => {
      if (res.imported.length) toast.success(`Imported ${res.imported.length} file${res.imported.length === 1 ? "" : "s"}`);
      if (res.skipped.length) toast.error(`Skipped ${res.skipped.length}: ${res.skipped[0]?.reason ?? ""}`);
      setSelected({});
      onImported();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedCount = Object.keys(selected).length;
  const openFolder = (entry: DriveEntry) => {
    setSearch("");
    setTerm("");
    setCrumbs((prev) => [...prev, { id: entry.id, name: entry.name }]);
  };
  const toggle = (e: DriveEntry) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[e.id]) delete next[e.id];
      else next[e.id] = e;
      return next;
    });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex max-h-[85vh] flex-col p-0">
        <SheetHeader className="border-b border-border/60 p-4">
          <SheetTitle className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" /> Google Drive
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Pick files or whole folders. Folders import every file inside them (up to 100).
          </p>
        </SheetHeader>

        <div className="flex items-center gap-2 border-b border-border/60 p-3">
          <Input
            value={search}
            placeholder="Search your Drive"
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") setTerm(search.trim()); }}
          />
          <Button size="icon" variant="secondary" onClick={() => setTerm(search.trim())}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {!term && (
          <div className="flex flex-wrap items-center gap-1 px-4 py-2 text-xs text-muted-foreground">
            {crumbs.map((c, i) => (
              <span key={c.id} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <button
                  type="button"
                  className={i === crumbs.length - 1 ? "text-foreground" : "hover:text-foreground"}
                  onClick={() => setCrumbs((p) => p.slice(0, i + 1))}
                >
                  {c.name}
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex-1 space-y-1 overflow-y-auto p-3">
          {entries.isLoading && (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          )}
          {entries.isError && (
            <p className="p-3 text-sm text-destructive">{(entries.error as Error).message}</p>
          )}
          {entries.data?.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nothing here.</p>}
          {(entries.data ?? []).map((e) => {
            const isSelected = Boolean(selected[e.id]);
            return (
              <div
                key={e.id}
                className={`flex items-center gap-2 rounded-lg border p-2.5 ${
                  isSelected ? "border-primary/60 bg-primary/5" : "border-border/60"
                }`}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => {
                    if (e.isFolder) openFolder(e);
                    else toggle(e);
                  }}
                >
                  {e.isFolder ? <Folder className="h-4 w-4 shrink-0 text-primary" /> : <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{e.name}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      {e.isFolder ? "Folder" : e.mimeType.replace("application/vnd.google-apps.", "Google ")}
                      {e.size ? ` · ${Math.max(1, Math.round(e.size / 1024))} KB` : ""}
                    </span>
                  </span>
                </button>
                <Button
                  size="sm"
                  variant={isSelected ? "default" : "secondary"}
                  className="h-8 shrink-0 px-2 text-xs"
                  onClick={() => toggle(e)}
                >
                  {isSelected ? <Check className="h-3.5 w-3.5" /> : "Select"}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border/60 p-3">
          <Button
            className="w-full"
            disabled={selectedCount === 0 || doImport.isPending}
            onClick={() => doImport.mutate()}
          >
            {doImport.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Import {selectedCount > 0 ? `${selectedCount} item${selectedCount === 1 ? "" : "s"}` : ""}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
