import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/wishr/AppShell";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Wishr works - wishes, giving and safety" },
      {
        name: "description",
        content:
          "How wishes are shared, how giving works, and how Wishr keeps things honest and dignified.",
      },
      { property: "og:title", content: "How Wishr works" },
      {
        property: "og:description",
        content: "How wishes are shared, how giving works, and how Wishr keeps things honest.",
      },
    ],
  }),
  component: HowItWorks,
});

const SECTIONS = [
  {
    title: "For wishers",
    items: [
      "Write your wish plainly - what you need and why it matters.",
      "Set a realistic goal in Naira and an optional deadline.",
      "You can stay anonymous; only your wish is shown.",
      "Post updates so the people who helped can see how it ended.",
    ],
  },
  {
    title: "For givers",
    items: [
      "Give any amount, from ₦500 upward.",
      "Choose to be named or anonymous, and leave a short note.",
      "You'll see the wish progress every time someone chips in.",
    ],
  },
  {
    title: "Safety and honesty",
    items: [
      "Every wish can be reported, and our team reviews reports.",
      "Wishes with signs of fraud are removed and the wisher is blocked.",
      "Contributor identities are never shown when anonymous is chosen.",
    ],
  },
];

function HowItWorks() {
  return (
    <AppShell>
      <section className="pt-8">
        <h1 className="font-display text-3xl">How Wishr works</h1>
        <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-mute">
          Wishr is built on one idea: asking for help should feel human, not humiliating.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {SECTIONS.map((section) => (
            <div key={section.title} className="card-frame p-5 border-2 border-ink">
              <h2 className="font-display text-xl">{section.title}</h2>
              <ul className="mt-3 space-y-2.5">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-mute">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[20px] border-2 border-dashed border-ink p-5 text-sm text-mute">
          Payments are not connected yet. Contributions you make today are recorded so you can see
          the full flow, but no money moves.
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/new"
            className="rounded-xl bg-primary px-5 py-3.5 text-center text-sm font-semibold text-primary-foreground"
          >
            Make a wish
          </Link>
          <Link
            to="/explore"
            className="rounded-xl bg-card px-5 py-3.5 text-center text-sm font-semibold text-ink border-2 border-ink"
          >
            Explore wishes
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
