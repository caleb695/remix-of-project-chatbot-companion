import { createFileRoute, Outlet, redirect, Link, useRouterState } from "@tanstack/react-router";
import { User, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useKeyboardInset } from "@/hooks/use-keyboard-inset";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedShell,
});

function AuthedShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const onChat = path.startsWith("/chat");
  const onAccount = path.startsWith("/account");
  const kb = useKeyboardInset();
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <div className="flex-1 overflow-hidden pb-[calc(3.75rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </div>
      {kb === 0 && (
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-md grid-cols-2">
          <TabLink to="/account" active={onAccount} icon={<User className="h-5 w-5" />} label="Account" />
          <TabLink to="/chat" active={onChat} icon={<MessageSquare className="h-5 w-5" />} label="Chat" />
        </div>
      </nav>
      )}
    </div>
  );
}

function TabLink({ to, active, icon, label }: { to: string; active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}