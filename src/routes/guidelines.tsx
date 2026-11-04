import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/wishr/InfoPage";

export const Route = createFileRoute("/guidelines")({
  head: infoHead("Community Guidelines", "How we look out for each other on Wishr."),
  component: GuidelinesPage,
});

function GuidelinesPage() {
  return (
    <InfoPage
      eyebrow="Community"
      title="Community Guidelines"
      intro="Wishr only works when people can trust each other. A few simple promises keep it that way."
      sections={[
        { heading: "Tell the truth", body: <p>Ask only for what you really need. Don't stretch your story, and don't post for someone else unless they've said yes.</p> },
        { heading: "Be kind", body: <p>Everyone here is either asking for help or trying to give it. Treat people with respect. No insults, hate, threats, or pushing anyone to give.</p> },
        { heading: "Keep personal details private", body: <p>Don't put phone numbers, home addresses or bank details in public posts. Use Wishr's private chats to sort out the details.</p> },
        { heading: "Give with an open hand", body: <p>Giving is always a choice. Never ask for anything back in return for help.</p> },
        { heading: "Things we don't allow", body: <p>Weapons, drugs, alcohol, tobacco, fake or stolen goods, animals, or anything illegal in Nigeria.</p> },
        { heading: "If something goes wrong", body: <p>Tap Report on anything that doesn't feel right. Our team will take a look, and may hide posts or pause accounts that break these promises.</p> },
      ]}
    />
  );
}
