import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/wishr/InfoPage";

export const Route = createFileRoute("/guidelines")({
  head: infoHead('Community Guidelines', 'Wishr works because people are honest and kind. These guidelines keep it that way.'),
  component: GuidelinesPage,
});

function GuidelinesPage() {
  return (
    <InfoPage
      eyebrow='Community'
      title='Community Guidelines'
      intro='Wishr works because people are honest and kind. These guidelines keep it that way.'
      sections={[
    { heading: "Be truthful", body: <p>Only share real wishes for things you genuinely need. Do not exaggerate, invent stories, or post on behalf of someone without their permission.</p> },
    { heading: "Be respectful", body: <p>Treat wishers, givers and recipients with dignity. No insults, hate speech, threats, or pressure to give.</p> },
    { heading: "Keep private details private", body: <p>Never post phone numbers, home addresses or bank details in public descriptions or updates. Use Wishr"s private chats to arrange handoffs.</p> },
    { heading: "Give freely", body: <p>Giving on Wishr is voluntary. Never demand anything in return for a contribution or giveaway.</p> },
    { heading: "No prohibited items", body: <p>Do not offer or request weapons, drugs, alcohol, tobacco, counterfeit goods, stolen property, animals, or anything illegal in Nigeria.</p> },
    { heading: "What happens if rules are broken", body: <p>Our team may hide or remove wishes and giveaways and suspend accounts that break these guidelines. Use the Report button to flag anything that looks wrong.</p> },
      ]}
    />
  );
}
