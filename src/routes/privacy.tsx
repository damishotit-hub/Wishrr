import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/wishr/InfoPage";

export const Route = createFileRoute("/privacy")({
  head: infoHead('Privacy Policy', 'This policy explains what information Wishr collects and how we use it.'),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <InfoPage
      eyebrow='Legal'
      title='Privacy Policy'
      intro='This policy explains what information Wishr collects and how we use it.'
      sections={[
    { heading: "What we collect", body: <p>Your account details (name, email, optional profile photo), the wishes, giveaways, messages and reports you create, and basic usage information needed to run the service.</p> },
    { heading: "Bank details", body: <p>Bank details you add to a wish are stored privately. They are shown only to signed-in givers who choose to transfer, never on public pages.</p> },
    { heading: "Private chats", body: <p>Messages between wishers, givers and recipients are visible only to the two people in the conversation, and to our team when investigating a report.</p> },
    { heading: "How we use information", body: <p>To run Wishr, keep the community safe, send you notifications about your activity, and improve the service. We do not sell your personal information.</p> },
    { heading: "Your choices", body: <p>You can edit your profile, delete your wishes and giveaways, and ask us to delete your account.</p> },
      ]}
    />
  );
}
