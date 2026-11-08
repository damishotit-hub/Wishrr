import { Gift, HandHeart } from "lucide-react";
import type { MemberRecognition } from "@/lib/member-recognition";

export function MemberBadge({ kind }: { kind: MemberRecognition }) {
  const isGiver = kind === "giver";
  const Icon = isGiver ? Gift : HandHeart;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-2 py-1 text-[10px] font-semibold leading-none ${isGiver ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>
      <Icon className="size-3" aria-hidden="true" />
      {isGiver ? "Giver" : "Receiver"}
    </span>
  );
}