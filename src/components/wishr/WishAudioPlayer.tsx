import { useQuery } from "@tanstack/react-query";
import { Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function WishAudioPlayer({ path }: { path: string | null }) {
  const audio = useQuery({
    queryKey: ["wish-audio", path],
    enabled: !!path,
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage.from("wish-audio").createSignedUrl(path, 300);
      if (error) throw error;
      return data.signedUrl;
    },
    staleTime: 240_000,
    refetchInterval: 240_000,
  });
  if (!path) return null;
  return <section className="mt-4 min-w-0 border-t border-line pt-3" aria-label="Wisher voice message">
    <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink"><Volume2 className="size-4 text-primary" />Hear their story</p>
    {audio.data ? <audio controls preload="none" src={audio.data} className="h-10 w-full min-w-0" aria-label="Play wisher voice message" onPlay={(event) => {
      document.querySelectorAll("audio").forEach((other) => { if (other !== event.currentTarget) other.pause(); });
    }} /> : <p className="text-xs text-mute">{audio.isError ? "Voice message unavailable right now." : "Loading voice message…"}</p>}
  </section>;
}