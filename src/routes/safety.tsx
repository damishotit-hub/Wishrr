import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/wishr/InfoPage";

export const Route = createFileRoute("/safety")({
  head: infoHead('Staying safe on Wishr', 'A few simple habits protect both wishers and givers.'),
  component: SafetyPage,
});

function SafetyPage() {
  return (
    <InfoPage
      eyebrow='Trust'
      title='Staying safe on Wishr'
      intro='A few simple habits protect both wishers and givers.'
      sections={[
    { heading: "For givers", body: <p>Read the whole wish before giving. Transfer only to the account shown inside Wishr. A transfer only counts once the wisher confirms it arrived.</p> },
    { heading: "For wishers", body: <p>Confirm transfers only after checking your bank. Post updates so givers can see their help landed.</p> },
    { heading: "Meeting in person", body: <p>For item handoffs, meet in a busy public place during the day, bring a friend if you can, and tell someone where you are going.</p> },
    { heading: "Spotting scams", body: <p>Be careful of anyone who asks you to pay a fee to receive a giveaway, moves you off Wishr quickly, or pressures you to act fast.</p> },
    { heading: "Reporting", body: <p>Use Report Wish or Report Giveaway on any page. Reports are private and reviewed by our team.</p> },
      ]}
    />
  );
}
