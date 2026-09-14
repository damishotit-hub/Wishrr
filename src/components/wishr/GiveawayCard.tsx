import { Link } from "@tanstack/react-router";
import { CATEGORY_LABELS, daysLeft, initials, timeAgo } from "@/lib/format";
import type { Giveaway } from "@/lib/queries";

const GIVEAWAY_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "In review",
  active: "Open",
  closed: "Closed",
  recipient_selected: "Recipient chosen",
  fulfilled: "Given",
  cancelled: "Cancelled",
};

export function GiveawayCard({ giveaway, index = 0 }: { giveaway: Giveaway; index?: number }) {
  const left = daysLeft(giveaway.deadline);
  const open = giveaway.status === "active";

  return (
    <article
      className="card-frame reveal lift overflow-hidden"
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      <Link to="/giveaways" className="block border-b-2 border-ink">
        {giveaway.image_url ? (
          <img
            src={giveaway.image_url}
            alt={giveaway.image_caption ?? giveaway.title}
            loading="lazy"
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <div className="grid aspect-[16/10] w-full place-items-center bg-warm">
            <span className="font-display text-3xl text-ink/40">Wishr</span>
          </div>
        )}
      </Link>

      {giveaway.image_caption ? (
        <p className="border-b-2 border-ink bg-accent px-4 py-2 text-[12px] font-semibold text-ink">
          {giveaway.image_caption}
        </p>
      ) : null}

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill">{CATEGORY_LABELS[giveaway.category] ?? giveaway.category}</span>
          <span className={open ? "pill-accent" : "pill-outline"}>
            {GIVEAWAY_STATUS_LABELS[giveaway.status] ?? giveaway.status}
          </span>
        </div>

        <h3 className="mt-3 font-display text-lg leading-snug">{giveaway.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-mute">
          {giveaway.description}
        </p>

        <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-mute">
          <span className="grid size-4 place-items-center rounded-full bg-ink text-[8px] font-semibold text-card">
            {initials(giveaway.giver_display_name)}
          </span>
          <span className="truncate">{giveaway.giver_display_name}</span>
          {giveaway.location ? <span className="truncate">· {giveaway.location}</span> : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t-2 border-ink pt-3">
          <span className="text-xs font-medium text-mute">
            {giveaway.entry_count} {giveaway.entry_count === 1 ? "entry" : "entries"}
            {left ? ` · ${left}` : ` · ${timeAgo(giveaway.created_at)}`}
          </span>
          <span className="shrink-0 rounded-lg bg-card px-4 py-2 text-xs font-semibold text-ink border-2 border-ink">
            {giveaway.recipient_count} {giveaway.recipient_count === 1 ? "recipient" : "recipients"}
          </span>
        </div>
      </div>
    </article>
  );
}

export function GiveawayCardSkeleton() {
  return (
    <div className="card-frame reveal overflow-hidden">
      <div className="aspect-[16/10] w-full shimmer" />
      <div className="p-5">
        <div className="h-5 w-24 shimmer rounded-full" />
        <div className="mt-4 h-5 w-3/4 shimmer rounded" />
        <div className="mt-2 h-4 w-full shimmer rounded" />
        <div className="mt-4 h-8 w-full shimmer rounded" />
      </div>
    </div>
  );
}
