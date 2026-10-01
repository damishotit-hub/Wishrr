import { Link } from "@tanstack/react-router";
import logo from "@/assets/wishr-logo.png.asset.json";

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <Link to="/" aria-label="Wishr home" className="inline-flex shrink-0 items-center">
      <img src={logo.url} alt="Wishr" className={size === "sm" ? "h-8 w-auto" : "h-10 w-auto md:h-11"} />
    </Link>
  );
}
