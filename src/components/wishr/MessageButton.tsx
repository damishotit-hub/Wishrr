import { useNavigate } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { startConversation } from "@/lib/messages";

export function MessageButton({ otherId, label = "Message" }: { otherId: string | null | undefined; label?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!user || !otherId || otherId === user.id) return null;
  async function go() {
    setBusy(true); setError(null);
    try {
      const id = await startConversation(otherId!);
      await navigate({ to: "/messages/$id", params: { id } });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not open chat."); setBusy(false); }
  }
  return (
    <span className="inline-flex flex-col">
      <button type="button" disabled={busy} onClick={() => void go()} className="press inline-flex items-center justify-center gap-2 rounded-lg border-2 border-ink bg-card px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60">
        <MessageCircle className="size-4" />{busy ? "Opening..." : label}
      </button>
      {error ? <span role="alert" className="mt-1 text-xs text-destructive">{error}</span> : null}
    </span>
  );
}
