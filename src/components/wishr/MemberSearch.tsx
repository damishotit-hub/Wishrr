import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { memberSearchQuery } from "@/lib/queries";
import { MemberAvatar } from "./MemberAvatar";

export function MemberSearch({ compact = false, variant = "plain" }: { compact?: boolean; variant?: "plain" | "bold" | "hero" }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(value.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [value]);
  const results = useQuery({ ...memberSearchQuery(query), enabled: open && query.length >= 2 });

  return <>
    {variant === "hero" ? (
      <button type="button" onClick={() => setOpen(true)} aria-label="Search members" className="press flex w-full items-center gap-3 rounded-xl border-2 border-ink bg-card px-4 py-4 text-left hard-shadow-sm md:max-w-xl">
        <Search className="size-5 text-primary" /><span className="flex-1 text-base font-bold text-ink">Find someone by @username or name</span><span className="hidden rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground sm:inline">Search</span>
      </button>
    ) : variant === "bold" ? (
      <button type="button" onClick={() => setOpen(true)} aria-label="Search members" className="press inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-card px-3 py-1.5 text-sm font-bold text-ink">
        <Search className="size-4 text-primary" /><span className="hidden sm:inline">Search people</span>
      </button>
    ) : (
      <Button type="button" variant="ghost" size={compact ? "icon" : "sm"} onClick={() => setOpen(true)} aria-label="Search members" className="text-mute hover:text-ink">
        <Search />{compact ? null : <span>People</span>}
      </Button>
    )}
    {open ? <div className="fixed inset-0 z-[100] bg-ink/45 p-4 pt-[10vh]" role="dialog" aria-modal="true" aria-label="Search Wishr members" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="mx-auto w-full max-w-lg rounded-lg border border-line bg-card p-4 soft-shadow">
        <div className="flex items-center gap-2">
          <Search className="size-5 text-mute" />
          <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search @username or name" aria-label="Search by username or display name" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-mute" />
          <Button type="button" size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Close search"><X /></Button>
        </div>
        <div className="mt-2 border-t border-line pt-2">
          {query.length < 2 ? <p className="px-2 py-6 text-center text-sm text-mute">Type at least two characters.</p> : results.isPending ? <p className="px-2 py-6 text-center text-sm text-mute">Searching...</p> : results.data?.length ? <ul className="space-y-1">{results.data.map((profile) => <li key={profile.id}><Link to="/u/$username" params={{ username: profile.username }} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"><MemberAvatar path={profile.avatar_url} name={profile.display_name} /><span className="min-w-0"><strong className="block truncate text-sm">{profile.display_name}</strong><span className="block truncate text-xs text-mute">@{profile.username}</span></span></Link></li>)}</ul> : <p className="px-2 py-6 text-center text-sm text-mute">No members found.</p>}
        </div>
      </div>
    </div> : null}
  </>;
}