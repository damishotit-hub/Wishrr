import { Link } from "@tanstack/react-router";
import { naira } from "@/lib/format";
import type { ImpactWish } from "@/lib/queries";

export function ImpactCard({ wish }: { wish: ImpactWish }) {
  const note = wish.wish_appreciations?.[0] ?? null;
  const img = note?.image_url ?? wish.image_url;
  return (
    <Link to="/wish/$id" params={{ id: wish.id }} className="lift card-frame block overflow-hidden">
      {img ? <img src={img} alt={wish.title} loading="lazy" className="aspect-[16/10] w-full border-b-2 border-ink object-cover" /> : null}
      <div className="p-4">
        <span className="pill-accent">Wish granted</span>
        <h3 className="mt-2 font-display text-lg leading-snug">{wish.title}</h3>
        <p className="mt-1 text-xs text-mute">{naira(Number(wish.amount_raised))} raised by kind givers</p>
        {note ? <p className="mt-3 line-clamp-3 border-l-4 border-primary pl-3 text-sm italic">"{note.body}"</p> : <p className="mt-3 text-sm text-mute">Thank-you note coming soon.</p>}
      </div>
    </Link>
  );
}
