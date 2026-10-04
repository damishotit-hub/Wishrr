import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GIVEAWAY_STATUS_LABELS, myGiveawaysQuery, myWinsQuery } from "@/lib/giveaways";

const GROUPS: { label: string; statuses: string[] }[] = [
  { label: "Active", statuses: ["active", "pending_review", "recipient_selected", "closed"] },
  { label: "Drafts", statuses: ["draft"] },
  { label: "Completed", statuses: ["fulfilled", "cancelled"] },
];

export function MyGiveaways({ userId }: { userId: string }) {
  const mine = useQuery(myGiveawaysQuery(userId));
  const wins = useQuery(myWinsQuery(userId));

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-xl">Your giveaways</h2>
        <Link to="/giveaways/new" className="press rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          Create a Giveaway
        </Link>
      </div>

      {wins.data?.length ? (
        <div className="mt-4 card-frame border-2 border-ink bg-accent p-4">
          <p className="font-display text-base">Congratulations! You were selected for a giveaway.</p>
          <ul className="mt-2 space-y-1">
            {wins.data.map((w) => (
              <li key={w.id}>
                <Link to="/giveaways/$id" params={{ id: w.giveaway_id }} className="text-sm font-semibold underline">
                  {w.giveaways?.title ?? "View giveaway"}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {mine.isPending ? (
        <div className="mt-4 h-24 shimmer rounded-lg" />
      ) : !mine.data?.length ? (
        <p className="mt-3 text-sm text-mute">You haven't offered anything yet. Have something someone else needs?</p>
      ) : (
        GROUPS.map((g) => {
          const items = mine.data.filter((x) => g.statuses.includes(x.status));
          if (!items.length) return null;
          return (
            <div key={g.label} className="mt-5">
              <p className="eyebrow">{g.label}</p>
              <ul className="mt-2 divide-y-2 divide-ink card-frame">
                {items.map((x) => (
                  <li key={x.id}>
                    <Link to="/giveaways/$id" params={{ id: x.id }} className="flex items-center justify-between gap-3 p-4">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{x.title}</span>
                        <span className="text-xs text-mute">{x.entry_count} {x.entry_count === 1 ? "entry" : "entries"}</span>
                      </span>
                      <span className="pill-outline shrink-0">{GIVEAWAY_STATUS_LABELS[x.status] ?? x.status}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
}
