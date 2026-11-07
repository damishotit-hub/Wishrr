import { useQuery } from "@tanstack/react-query";
import { Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function WishVideoPlayer({ path }: { path: string | null }) {
  const video = useQuery({
    queryKey: ["wish-video", path],
    enabled: !!path,
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage.from("wish-video").createSignedUrl(path, 300);
      if (error) throw error;
      return data.signedUrl;
    },
    staleTime: 240_000,
    refetchInterval: 240_000,
  });
  if (!path) return null;
  return <section className="mt-4 min-w-0 border-t border-line pt-3" aria-label="Wisher video message">
    <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink"><Video className="size-4 text-primary" />Watch their story</p>
    {video.data ? <video controls playsInline preload="metadata" src={video.data} className="aspect-video w-full min-w-0 rounded-lg bg-ink object-contain" aria-label="Play wisher video message" onPlay={(event) => {
      document.querySelectorAll("video").forEach((other) => { if (other !== event.currentTarget) other.pause(); });
    }} /> : <p className="text-xs text-mute">{video.isError ? "Video unavailable right now." : "Loading video…"}</p>}
  </section>;
}