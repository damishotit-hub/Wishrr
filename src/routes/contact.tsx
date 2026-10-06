import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/wishr/InfoPage";

export const Route = createFileRoute("/contact")({
  head: infoHead('Contact us', "We'd love to hear from you."),
  component: ContactPage,
});

function ContactPage() {
  return (
    <InfoPage
      eyebrow='Company'
      title='Contact us'
      intro="We'd love to hear from you."
      sections={[
    { heading: "Safety concerns", body: <p>If something looks wrong on a wish or giveaway, use the Report button on that page. It reaches our moderation team directly.</p> },
    { heading: "General questions", body: <p>Email <a className="font-semibold text-primary underline underline-offset-4" href="mailto:idowudaviddamilola@gmail.com">idowudaviddamilola@gmail.com</a>. You can also check How Wishr Works and our Safety page for answers to common questions.</p> },
      ]}
    />
  );
}
