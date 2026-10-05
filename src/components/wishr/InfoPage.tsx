import type { ReactNode } from "react";
import { AppShell } from "./AppShell";

export function InfoPage({ eyebrow, title, intro, sections, children }: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: { heading: string; body: ReactNode }[];
  children?: ReactNode;
}) {
  return (
    <AppShell>
      <article className="reveal mx-auto max-w-3xl pt-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">{title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-mute">{intro}</p>
        <div className="mt-8 space-y-4">
          {sections.map((s) => (
            <section key={s.heading} className="card-frame p-5">
              <h2 className="font-display text-lg">{s.heading}</h2>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink/90">{s.body}</div>
            </section>
          ))}
        </div>
        {children}
        <p className="mt-8 text-xs text-mute">Last updated October 2026.</p>
      </article>
    </AppShell>
  );
}

export function infoHead(title: string, description: string) {
  return () => ({
    meta: [
      { title: `${title} - Wishr` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} - Wishr` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  });
}
