import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { OnboardingPrompt } from "@/components/wishr/OnboardingPrompt";
import { initials } from "@/lib/format";
import { MemberSearch } from "./MemberSearch";
import { CommunityPulse } from "@/lib/community";
import { MessagesLink } from "./MessagesLink";
import { Compass, Gift, House, MessageCircle, Plus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home", icon: House },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/new", label: "Wish", icon: Plus },
  { to: "/giveaways", label: "Giveaways", icon: Gift },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/dashboard", label: "Profile", icon: UserRound },
] as const;

const FOOTER = [
  { title: "Explore", links: [
    { to: "/explore", label: "Wishes" }, { to: "/giveaways", label: "Giveaways" },
    { to: "/impact", label: "Impact Wall" }, { to: "/how-it-works", label: "How Wishr Works" },
  ] },
  { title: "Community & Trust", links: [{ to: "/guidelines", label: "Community Guidelines" }, { to: "/safety", label: "Safety" }] },
  { title: "Company", links: [{ to: "/about", label: "About Us" }, { to: "/contact", label: "Contact" }] },
  { title: "Legal", links: [{ to: "/privacy", label: "Privacy Policy" }, { to: "/terms", label: "Terms of Service" }] },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const name = (user?.user_metadata?.["display_name"] as string) ?? user?.email ?? "";
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    const sections = mainRef.current?.querySelectorAll("section") ?? [];
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top < window.innerHeight) return;
      section.classList.add("scroll-reveal");
      observer.observe(section);
    });
    return () => {
      observer.disconnect();
      sections.forEach((section) => section.classList.remove("scroll-reveal", "is-visible"));
    };
  }, [pathname]);

  return (
    <div className="wishr-shell min-h-screen font-body text-ink antialiased">
      <header className="mx-auto w-full max-w-[430px] px-6 pt-7 md:max-w-5xl md:pt-10">
        <div className="flex items-center justify-between">
          <Logo />

          <nav className="desktop-nav hidden items-center gap-4 text-xs font-semibold lg:flex">
            <Link to="/explore" className="text-mute hover:text-ink">
              Explore
            </Link>
            <Link to="/giveaways" className="text-mute hover:text-ink">
              Giveaways
            </Link>
            <Link to="/impact" className="text-mute hover:text-ink">
              Impact
            </Link>
            <Link to="/new" className="text-mute hover:text-ink">
              Make a Wish
            </Link>
            <Link to="/how-it-works" className="text-mute hover:text-ink">
              How It Works
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? <MemberSearch variant="bold" /> : null}
            {loading ? (
              <span className="size-8 animate-pulse rounded-full bg-warm" />
            ) : user ? (
              <>
                <div className="hidden xl:block"><MessagesLink /></div>
                <Link to="/activity" className="hidden text-sm font-semibold text-mute hover:text-ink sm:inline">
                  Activity
                </Link>
                <Link
                  to="/dashboard"
                  aria-label="Your dashboard"
                  className="grid size-8 place-items-center rounded-lg border border-line bg-secondary text-sm font-semibold text-secondary-foreground"
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
                  className="press hidden rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground md:inline-block"
                >
                  Make a Wish
                </Link>

              </>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
          {user ? <div className="mr-auto hidden md:block xl:hidden"><MessagesLink /></div> : null}
          <CommunityPulse />
        </div>
      </header>

      <main ref={mainRef} className="wishr-main mx-auto w-full max-w-[430px] px-5 md:max-w-5xl">
        {children}
      </main>

      <OnboardingPrompt />

      <footer className="border-t border-line bg-card/95 pb-28 md:pb-0">
        <div className="mx-auto grid max-w-[430px] gap-8 px-5 py-10 md:max-w-5xl md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <Logo size="sm" />
            <p className="mt-3 text-sm text-mute">Make a wish, someone might make it happen.</p>
            <a href="mailto:idowudaviddamilola@gmail.com" className="mt-3 block break-all text-xs font-semibold text-primary">idowudaviddamilola@gmail.com</a>
          </div>
          {FOOTER.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="eyebrow">{col.title}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.to}><Link to={l.to} className="font-semibold text-mute hover:text-ink">{l.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="border-t border-line py-4 text-center text-xs text-mute">© {new Date().getFullYear()} Wishr</p>
      </footer>

      <nav
        aria-label="Main"
        className="mobile-dock fixed left-1/2 z-40 -translate-x-1/2 md:hidden"
      >
        <div className="grid grid-cols-6 items-center gap-0.5">
          {NAV.map((item) => {
            if (item.to === "/messages") return <MessagesLink key={item.to} variant="dock" />;
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to as string);
            const Icon = item.icon;
            return (
              <Button
                key={item.to}
                asChild
                variant="ghost"
                className="dock-item h-auto min-w-0 flex-col gap-1 rounded-full px-0 py-2 hover:bg-transparent"
              >
                <Link to={item.to} aria-label={item.to === "/new" ? "Make a wish" : item.label} aria-current={active ? "page" : undefined}>
                  <span className={item.to === "/new" ? "dock-create" : "dock-icon"}>
                    <Icon aria-hidden="true" className="!size-5" strokeWidth={active ? 2.4 : 1.8} />
                  </span>
                  <span className="text-[9px] font-semibold leading-3">{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
