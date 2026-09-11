import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/new", label: "Make a wish" },
  { to: "/activity", label: "Activity" },
  { to: "/dashboard", label: "Profile" },
] as const;

function Dot({ active, square }: { active: boolean; square?: boolean }) {
  return (
    <span className="grid size-6 place-items-center">
      <span
        className={[
          "size-2.5",
          square ? "rounded-[3px]" : "rounded-full",
          active ? "bg-primary" : "ring-1 ring-mute",
        ].join(" ")}
      />
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const name = (user?.user_metadata?.["display_name"] as string) ?? user?.email ?? "";

  return (
    <div className="min-h-screen bg-canvas font-body text-ink antialiased">
      <header className="mx-auto w-full max-w-[430px] px-5 pt-6 md:max-w-5xl">
        <div className="flex items-center justify-between">
          <Logo />

          <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
            <Link to="/explore" className="text-mute hover:text-ink">
              Explore
            </Link>
            <Link to="/new" className="text-mute hover:text-ink">
              Make a Wish
            </Link>
            <Link to="/how-it-works" className="text-mute hover:text-ink">
              How It Works
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {loading ? (
              <span className="size-8 animate-pulse rounded-full bg-warm" />
            ) : user ? (
              <>
                <Link to="/activity" className="text-sm font-semibold text-mute hover:text-ink">
                  Activity
                </Link>
                <Link
                  to="/dashboard"
                  aria-label="Your dashboard"
                  className="grid size-8 place-items-center rounded-full bg-warm text-sm font-semibold text-ink"
                >
                  {initials(name)}
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth" className="text-sm font-semibold text-mute hover:text-ink">
                  Sign In
                </Link>
                <Link
                  to="/new"
                  className="hidden rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground md:inline-block"
                >
                  Make a Wish
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[430px] px-5 pb-32 md:max-w-5xl md:pb-20">
        {children}
      </main>

      <footer className="hidden border-t border-line md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 text-xs text-mute">
          <span>Wishr - make a wish, someone might make it happen.</span>
          <Link to="/how-it-works" className="font-semibold hover:text-ink">
            How it works
          </Link>
        </div>
      </footer>

      <nav
        aria-label="Main"
        className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-card/95 px-2 py-2 backdrop-blur md:hidden"
      >
        <div className="flex items-center justify-between">
          {NAV.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to as string);
            if (item.to === "/new") {
              return (
                <Link key={item.to} to="/new" className="-mt-6 flex flex-col items-center gap-1">
                  <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm ring-4 ring-canvas">
                    <span className="font-display text-2xl leading-none">+</span>
                  </span>
                  <span className="text-[11px] font-semibold text-ink">Make a wish</span>
                </Link>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-1 flex-col items-center gap-1 py-1"
              >
                <Dot active={active} square={item.label === "Home" || item.label === "Activity"} />
                <span
                  className={
                    active
                      ? "text-[11px] font-semibold text-primary"
                      : "text-[11px] font-medium text-mute"
                  }
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
