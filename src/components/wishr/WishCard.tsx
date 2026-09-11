import { Link } from "@tanstack/react-router";
import { CATEGORY_LABELS, daysLeft, initials, naira, timeAgo } from "@/lib/format";
import { ProgressMeter } from "./ProgressMeter";
import type { Wish } from "@/lib/queries";

export function WishCard({ wish }: { wish: Wish }) {
  const raised = Number(wish.amount_raised);
  const goal = Number(wish.goal_amount);
  const remaining = Math.max(0, goal - raised);
  const left = daysLeft(wish.deadline);
  const fulfilled = remaining === 0;

  return (
    <article className="card-frame p-5 transition-transform active:scale-[0.99]">
      <div className="flex items-center justify-between gap-3">
        <span className="pill">{CATEGORY_LABELS[wish.category] ?? wish.category}</span>
        <span className="flex min-w-0 items-center gap-1 text-[11px] font-medium text-mute">
          {wish.is_anonymous ? (
            <span className="size-4 rounded-full bg-gradient-to-br from-primary to-ink" />
          ) : (
            <span className="grid size-4 place-items-center rounded-full bg-ink text-[8px] font-semibold text-card">
              {initials(wish.creator_display_name)}
            </span>
          )}
          <span className="truncate">
            {wish.is_anonymous ? "Anonymous" : wish.creator_display_name}
          </span>
        </span>
      </div>

      <h3 className="mt-3 font-display text-lg leading-snug">
        <Link to="/wish/$id" params={{ id: wish.id }} className="hover:text-primary">
          {wish.title}
        </Link>
      </h3>

      {wish.summary ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-mute">{wish.summary}</p>
      ) : null}

      <div className="mt-4">
        <ProgressMeter raised={raised} goal={goal} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="text-xs font-medium text-mute">
          {fulfilled ? "Fulfilled" : `${naira(remaining)} to go`}
          {left ? ` · ${left}` : ` · ${timeAgo(wish.created_at)}`}
        </span>
        <Link
          to="/wish/$id"
          params={{ id: wish.id }}
          className={
            fulfilled
              ? "shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-ink ring-1 ring-line transition-transform active:scale-[0.97]"
              : "shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
          }
        >
          {fulfilled ? "View wish" : "Help fulfill"}
        </Link>
      </div>
    </article>
  );
}

export function WishCardSkeleton() {
  return (
    <div className="rounded-[20px] bg-card p-5 ring-1 ring-line">
      <div className="h-5 w-24 animate-pulse rounded-full bg-warm" />
      <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-warm" />
      <div className="mt-2 h-4 w-full animate-pulse rounded bg-warm/70" />
      <div className="mt-4 h-1.5 w-full animate-pulse rounded-full bg-warm" />
      <div className="mt-4 h-8 w-full animate-pulse rounded bg-warm/50" />
    </div>
  );
}
