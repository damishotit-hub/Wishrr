import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/wishr/InfoPage";

export const Route = createFileRoute("/about")({
  head: infoHead('About Wishr', 'Wishr is a quiet, dignified place to say what you need and let people who care help you get there.'),
  component: AboutPage,
});

function AboutPage() {
  return (
    <InfoPage
      eyebrow='Company'
      title='About Wishr'
      intro='Wishr is a quiet, dignified place to say what you need and let people who care help you get there.'
      sections={[
    { heading: "Why we exist", body: <p>Small things change lives: school fees, a sewing machine, a bus ticket home. Wishr makes it simple to ask, and simple to help.</p> },
    { heading: "How it is different", body: <p>Wishes, not campaigns. No pressure, no flashy fundraising. Just real people, clear goals in Naira, and honest updates.</p> },
    { heading: "Giving both ways", body: <p>Beyond money, people can offer items and services, or run giveaways for things they no longer need.</p> },
      ]}
    />
  );
}
