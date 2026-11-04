import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/wishr/InfoPage";

export const Route = createFileRoute("/terms")({
  head: infoHead("Terms of Service", "The simple ground rules for using Wishr, written in plain words."),
  component: TermsPage,
});

function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="These are the ground rules for using Wishr. We kept them short and plain so you know exactly where you stand."
      sections={[
        { heading: "Be yourself, honestly", body: <p>Use your real details, keep your password to yourself, and only post things that are true. If something about your account changes, update it.</p> },
        { heading: "Giving happens between people", body: <p>When you give, you send help straight to another member. Wishr never holds your money, so we can't promise every wish will be met or that every item will be exactly as described. Take a moment to read before you give.</p> },
        { heading: "What you post stays yours", body: <p>Your photos, stories and voice notes belong to you. By posting them, you let us show them on Wishr so people can see and respond. Delete them any time.</p> },
        { heading: "Keeping things safe", body: <p>If something breaks our Community Guidelines or puts someone at risk, we may hide it or pause the account behind it. We'd always rather talk first, where we can.</p> },
        { heading: "The honest limits", body: <p>We work hard to keep Wishr running well, but we can't be responsible for what happens in arrangements made between members. Use good judgment and reach out if anything feels off.</p> },
        { heading: "Questions?", body: <p>Email us at <a className="font-semibold text-primary" href="mailto:idowudaviddamilola@gmail.com">idowudaviddamilola@gmail.com</a>. A real person will reply.</p> },
      ]}
    />
  );
}
