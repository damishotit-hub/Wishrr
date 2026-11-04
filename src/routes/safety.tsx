import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/wishr/InfoPage";

export const Route = createFileRoute("/safety")({
  head: infoHead("Staying safe on Wishr", "Simple habits that protect both people asking and people giving."),
  component: SafetyPage,
});

function SafetyPage() {
  return (
    <InfoPage
      eyebrow="Trust"
      title="Staying safe on Wishr"
      intro="Most people here just want to help. These simple habits keep it that way for everyone."
      sections={[
        { heading: "If you're giving", body: <p>Read the whole wish first. Only send money to the account shown inside Wishr. Your gift counts once the person confirms it arrived.</p> },
        { heading: "If you're asking", body: <p>Check your bank before confirming a transfer. Share an update or a thank-you so givers know their help landed.</p> },
        { heading: "Meeting in person", body: <p>Pick a busy public place in daylight. Bring a friend if you can, and let someone know where you're going.</p> },
        { heading: "Signs something's not right", body: <p>Be careful if anyone asks you to pay a fee to receive a gift, rushes you, or wants to move the chat off Wishr quickly.</p> },
        { heading: "Tell us", body: <p>Use Report on any wish or giveaway. Reports are private, and our team reviews every one.</p> },
      ]}
    />
  );
}
