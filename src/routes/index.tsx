import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Github, MessageSquareCode, GitCommit, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Coderbot — an AI pair programmer for your GitHub repos" },
      { name: "description", content: "Connect a GitHub repo, pick a model, and chat. Coderbot reads and edits a working copy — nothing is pushed until you commit." },
      { property: "og:title", content: "Coderbot — an AI pair programmer for your GitHub repos" },
      { property: "og:description", content: "Connect a GitHub repo, pick a model, and chat. Coderbot reads and edits a working copy — nothing is pushed until you commit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setAuthed(Boolean(data.session));
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (authed) navigate({ to: "/chat" });
  }, [authed, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-mono text-sm font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            coderbot
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-20 pb-24">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Connect any GitHub repo. Commit only when you're ready.
          </div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            An AI pair programmer<br />
            <span className="text-muted-foreground">for your GitHub repos.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Sign in, pick a repo, choose an OpenRouter model, and chat.
            The AI reads and edits an in-app working copy of your project — nothing
            hits GitHub until you click <span className="font-mono text-foreground">Commit &amp; Push</span>.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Get started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="https://openrouter.ai" target="_blank" rel="noreferrer">
                What's OpenRouter?
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-24 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Github, title: "Bring your repo", body: "Connect GitHub in one click and pick from your projects." },
            { icon: MessageSquareCode, title: "Chat & edit", body: "The AI can read, write, and delete files across your project." },
            { icon: GitCommit, title: "You own the commit", body: "Review pending changes and push when — and only when — you say so." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-medium">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
