import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as DialogPrimitive from "@radix-ui/react-dialog";
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

  const trigger = variant === "hero" ? (
    <button type="button" aria-label="Search members" className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card px-4 py-4 text-left shadow-sm transition hover:shadow-md md:max-w-xl">
      <Search className="size-5 text-primary" /><span className="flex-1 text-base font-bold text-ink">Find someone by @username or name</span><span className="hidden rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground sm:inline">Search</span>
    </button>
  ) : variant === "bold" ? (
    <button type="button" aria-label="Search members" className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-card px-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-muted">
      <Search className="size-4" /><span className="hidden sm:inline">Search</span>
    </button>
  ) : (
    <Button type="button" variant="ghost" size={compact ? "icon" : "sm"} aria-label="Search members" className="text-mute hover:text-ink">
      <Search />{compact ? null : <span>People</span>}
    </Button>
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-ink/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content aria-describedby={undefined} className="fixed left-1/2 top-[10vh] z-[101] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-line bg-card p-4 shadow-xl duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <DialogPrimitive.Title className="sr-only">Search Wishr members</DialogPrimitive.Title>
          <div className="flex items-center gap-2">
            <Search className="size-5 text-mute" />
            <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search @username or name" aria-label="Search by username or display name" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-mute" />
            <DialogPrimitive.Close asChild><Button type="button" size="icon" variant="ghost" aria-label="Close search"><X /></Button></DialogPrimitive.Close>
          </div>
          <div className="mt-2 border-t border-line pt-2">
            {query.length < 2 ? <p className="px-2 py-6 text-center text-sm text-mute">Type at least two characters.</p> : results.isPending ? <p className="px-2 py-6 text-center text-sm text-mute">Searching...</p> : results.data?.length ? <ul className="space-y-1">{results.data.map((profile) => <li key={profile.id}><Link to="/u/$username" params={{ username: profile.username }} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-muted"><MemberAvatar path={profile.avatar_url} name={profile.display_name} /><span className="min-w-0"><strong className="block truncate text-sm">{profile.display_name}</strong><span className="block truncate text-xs text-mute">@{profile.username}</span></span></Link></li>)}</ul> : <p className="px-2 py-6 text-center text-sm text-mute">No members found.</p>}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
