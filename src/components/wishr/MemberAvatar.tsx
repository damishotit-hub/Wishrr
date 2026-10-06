import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { initials } from "@/lib/format";

export function MemberAvatar({ path, name, className = "size-10" }: { path: string | null; name: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) { setUrl(null); return; }
    let active = true;
    void supabase.storage.from("profile-avatars").createSignedUrl(path, 3600).then(({ data }) => {
      if (active) setUrl(data?.signedUrl ?? null);
    });
    return () => { active = false; };
  }, [path]);

  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-secondary font-display font-bold text-ink ${className}`}>
      {url ? <img src={url} alt="" className="size-full object-cover" /> : initials(name)}
    </span>
  );
}