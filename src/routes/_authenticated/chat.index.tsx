import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquarePlus, Github } from "lucide-react";
import { listThreads, createThread } from "@/lib/threads.functions";
import { listRepoSelections } from "@/lib/github.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listThreads);
  const reposFn = useServerFn(listRepoSelections);
  const createFn = useServerFn(createThread);

  const threads = useQuery({ queryKey: ["threads"], queryFn: () => listFn() });
  const repos = useQuery({ queryKey: ["repo_selections"], queryFn: () => reposFn() });

  const createMut = useMutation({
    mutationFn: (repoId: string) => createFn({ data: { repoId } }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
    },
  });

  useEffect(() => {
    if (threads.data && threads.data.length > 0) {
      navigate({ to: "/chat/$threadId", params: { threadId: threads.data[0].id }, replace: true });
    }
  }, [threads.data, navigate]);

  if (threads.isLoading || repos.isLoading) {
    return <div className="grid h-full place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  if (!repos.data || repos.data.length === 0) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div className="max-w-xs">
          <Github className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Connect a repo first</p>
          <p className="mt-1 text-sm text-muted-foreground">Head to the Account tab to connect GitHub and pick a project.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full place-items-center p-6 text-center">
      <div className="max-w-xs">
        <p className="font-medium">No chats yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Start a conversation about {repos.data[0].owner}/{repos.data[0].name}.</p>
        <Button className="mt-4" onClick={() => createMut.mutate(repos.data![0].id)} disabled={createMut.isPending}>
          <MessageSquarePlus className="mr-2 h-4 w-4" /> New chat
        </Button>
      </div>
    </div>
  );
}