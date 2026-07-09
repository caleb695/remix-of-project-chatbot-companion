import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { MessageSquarePlus, FolderGit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createThread } from "@/lib/threads.functions";

export const Route = createFileRoute("/_authenticated/repos/$repoId/")({
  component: RepoIndex,
});

function RepoIndex() {
  const { repoId } = useParams({ from: "/_authenticated/repos/$repoId/" });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const createFn = useServerFn(createThread);
  const create = useMutation({
    mutationFn: () => createFn({ data: { repoId } }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["threads", repoId] });
      navigate({ to: "/repos/$repoId/threads/$threadId", params: { repoId, threadId: t.id } });
    },
  });

  return (
    <div className="grid flex-1 place-items-center p-8">
      <div className="max-w-sm text-center">
        <FolderGit2 className="mx-auto h-8 w-8 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-medium">Ready when you are</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sync the repo (top right), then start a chat. The AI can read and edit files.
          Nothing hits GitHub until you commit.
        </p>
        <Button className="mt-4" onClick={() => create.mutate()}>
          <MessageSquarePlus className="mr-2 h-4 w-4" /> New chat
        </Button>
      </div>
    </div>
  );
}