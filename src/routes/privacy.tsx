import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/wishr/InfoPage";

export const Route = createFileRoute("/privacy")({
  head: infoHead("Privacy Policy", "What Wishr knows about you, why, and how we look after it."),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="You trust us with personal things when you ask for help. Here's what we keep, why we keep it, and how we look after it."
      sections={[
        { heading: "What we keep", body: <p>Your name, email, username and photo if you add one. The wishes, giveaways, messages and reports you create. A little usage information so the site works properly.</p> },
        { heading: "Shared devices", body: <p>When you register, we turn a few browser settings, such as browser type, screen size, language and time zone, into a hash to help admins spot accounts that may share a device. We store the hash, not the individual settings, and do not use precise location, canvas tracking or third-party trackers. A match is only a reason to review, not proof of abuse, and never stops you signing up. Existing accounts may have their browser recorded at their next sign-in. You can ask us to delete this record along with your account.</p> },
        { heading: "Your bank details", body: <p>These are never shown on public pages. Only signed-in people who choose to send you money can see them, and only on your wish.</p> },
        { heading: "Your messages", body: <p>Private chats are seen only by you and the person you're talking to. Our team looks only if someone reports a problem.</p> },
        { heading: "How we use it", body: <p>To run Wishr, keep people safe, let you know when something happens on your wishes, and make the site better. We do not sell your information. Ever.</p> },
        { heading: "You're in control", body: <p>Edit your profile, delete your wishes or giveaways, or ask us to delete your account at <a className="font-semibold text-primary" href="mailto:idowudaviddamilola@gmail.com">idowudaviddamilola@gmail.com</a>.</p> },
      ]}
    />
  );
}
