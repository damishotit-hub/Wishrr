import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/wishr/InfoPage";

export const Route = createFileRoute("/terms")({
  head: infoHead('Terms of Service', 'By using Wishr you agree to these terms.'),
  component: TermsPage,
});

function TermsPage() {
  return (
    <InfoPage
      eyebrow='Legal'
      title='Terms of Service'
      intro='By using Wishr you agree to these terms.'
      sections={[
    { heading: "Using Wishr", body: <p>You must provide accurate information, keep your account secure, and follow our Community Guidelines.</p> },
    { heading: "Giving and receiving", body: <p>Contributions and gifts are made directly between members. Wishr does not hold funds and cannot guarantee that any wish will be fulfilled or that any item matches its description.</p> },
    { heading: "Your content", body: <p>You own what you post. You allow Wishr to display it on the service so others can see and respond to it.</p> },
    { heading: "Moderation", body: <p>We may hide or remove content and suspend accounts that break these terms or put others at risk.</p> },
    { heading: "Liability", body: <p>Wishr is provided as is. To the extent permitted by law, Wishr is not liable for losses arising from interactions between members.</p> },
      ]}
    />
  );
}
