import { Link } from "@tanstack/react-router";
import { CATEGORY_LABELS, daysLeft, initials, naira, timeAgo } from "@/lib/format";
import { ProgressMeter } from "./ProgressMeter";
import type { Wish } from "@/lib/queries";

export function WishCard({ wish, index = 0 }: { wish: Wish; index?: number }) {
  const raised = Number(wish.amount_raised);
  const goal = Number(wish.goal_amount);
  const remaining = Math.max(0, goal - raised);
  const left = daysLeft(wish.deadline);
  const fulfilled = remaining === 0;

  return (
    <article
      className="card-frame reveal lift overflow-hidden"
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      {wish.image_url ? (
        <figure className="border-b-2 border-ink">
          <Link to="/wish/$id" params={{ id: wish.id }} className="block">
            <img
              src={wish.image_url}
              alt={wish.image_caption ?? wish.title}
              loading="lazy"
              className="aspect-[16/10] w-full object-cover"
            />
          </Link>
          {wish.image_caption ? (
            <figcaption className="border-t-2 border-ink bg-accent px-4 py-2 text-[12px] font-semibold text-ink">
              {wish.image_caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <div className="p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="pill">{CATEGORY_LABELS[wish.category] ?? wish.category}</span>
        <span className="flex min-w-0 items-center gap-1 text-[11px] font-medium text-mute">
          {wish.is_anonymous ? (
            <span className="size-4 rounded-full bg-primary" />
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
        <Link to="/wish/$id" params={{ id: wish.id }} className="transition-colors hover:text-primary">
          {wish.title}
        </Link>
      </h3>

      {wish.summary ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-mute">{wish.summary}</p>
      ) : null}


      <div className="mt-4">
        <ProgressMeter raised={raised} goal={goal} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t-2 border-ink pt-3">
        <span className="text-xs font-medium text-mute">
          {fulfilled ? "Fulfilled" : `${naira(remaining)} to go`}
          {left ? ` · ${left}` : ` · ${timeAgo(wish.created_at)}`}
        </span>
        <Link
          to="/wish/$id"
          params={{ id: wish.id }}
          className={
            fulfilled
              ? "shrink-0 rounded-lg bg-card px-4 py-2 text-xs font-semibold text-ink press"
              : "shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground press"
          }
        >
          {fulfilled ? "View wish" : "Help fulfill"}
        </Link>
      </div>
      </div>
    </article>

  );
}

export function WishCardSkeleton() {
  return (
    <div className="card-frame reveal p-5">
      <div className="h-5 w-24 shimmer rounded-full" />
      <div className="mt-4 h-5 w-3/4 shimmer rounded" />
      <div className="mt-2 h-4 w-full shimmer rounded" />
      <div className="mt-4 h-1.5 w-full shimmer rounded-full" />
      <div className="mt-4 h-8 w-full shimmer rounded" />
    </div>
  );
}
