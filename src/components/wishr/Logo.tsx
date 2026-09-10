import { Link } from "@tanstack/react-router";

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span
        className={
          size === "sm"
            ? "grid size-7 place-items-center rounded-lg bg-ink font-display text-base leading-none text-card"
            : "grid size-8 place-items-center rounded-lg bg-ink font-display text-lg leading-none text-card"
        }
      >
        W
      </span>
      <span className={size === "sm" ? "font-display text-lg" : "font-display text-xl"}>Wishr</span>
    </Link>
  );
}
