import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/wishr/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { categoriesQuery } from "@/lib/queries";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/giveaways/new")({
  head: () => ({
    meta: [
      { title: "Create a giveaway - Wishr" },
      {
        name: "description",
        content: "Offer something you no longer need to someone on Wishr who does.",
      },
      { property: "og:title", content: "Create a giveaway - Wishr" },
      {
        property: "og:description",
        content: "Offer something you no longer need to someone on Wishr who does.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewGiveaway,
});

const inputClass =
  "w-full rounded-lg border-2 border-ink bg-canvas px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-primary";

type GiveawayType = Database["public"]["Enums"]["giveaway_type"];

const TYPES: { value: GiveawayType; label: string }[] = [
  { value: "item", label: "An item" },
  { value: "service", label: "A service" },
  { value: "space", label: "A space" },
  { value: "skill", label: "A skill" },
  { value: "other", label: "Something else" },
];

function NewGiveaway() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const categories = useQuery(categoriesQuery);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [type, setType] = useState<GiveawayType>("item");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [recipients, setRecipients] = useState("1");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <AppShell>
        <div className="mt-8 h-64 shimmer rounded-lg" />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <section className="mx-auto max-w-md pt-12 text-center">
          <h1 className="font-display text-3xl">Sign in to give something</h1>
          <p className="mt-2 text-sm text-mute">
            We ask for an account so people can reach you about your giveaway.
          </p>
          <Link
            to="/auth"
            className="mt-6 inline-block press rounded-lg bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground"
          >
            Sign in or create account
          </Link>
        </section>
      </AppShell>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const displayName =
        (user!.user_metadata?.["display_name"] as string | undefined) ??
        user!.email?.split("@")[0] ??
        "A giver";

      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("wish-images")
          .upload(path, imageFile, { contentType: imageFile.type, upsert: false });
        if (uploadError) throw uploadError;
        const { data: signed, error: signError } = await supabase.storage
          .from("wish-images")
          .createSignedUrl(path, 60 * 60 * 24 * 3650);
        if (signError) throw signError;
        imageUrl = signed.signedUrl;
      }

      const { error: insertError } = await supabase.from("giveaways").insert({
        giver_id: user!.id,
        giver_display_name: displayName,
        title: title.trim(),
        description: description.trim(),
        category,
        giveaway_type: type,
        location: location.trim() || null,
        deadline: deadline || null,
        recipient_count: Math.max(1, Number(recipients) || 1),
        image_url: imageUrl,
        image_caption: imageUrl && caption.trim() ? caption.trim() : null,
        status: "active",
      });
      if (insertError) throw insertError;

      await queryClient.invalidateQueries({ queryKey: ["giveaways"] });
      await navigate({ to: "/giveaways" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't publish that giveaway.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-2xl pt-8">
        <h1 className="font-display text-3xl">Create a giveaway</h1>
        <p className="mt-2 text-sm text-mute">
          Sometimes you have something someone else needs. Describe it plainly.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4 card-frame p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-mute">What are you giving?</span>
            <input
              required
              maxLength={90}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Gently used school desk and chair"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-mute">Details</span>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Condition, size, pickup details, who it would suit."
              className={`${inputClass} resize-y`}
            />
          </label>

          <div className="card-flat p-4">
            <span className="eyebrow">Photo</span>
            <p className="mt-1 text-xs text-mute">A clear picture of what you are giving. Max 10MB.</p>

            {imagePreview ? (
              <figure className="mt-3 overflow-hidden rounded-lg border-2 border-ink">
                <img src={imagePreview} alt="Selected giveaway" className="aspect-[16/10] w-full object-cover" />
                {caption.trim() ? (
                  <figcaption className="border-t-2 border-ink bg-accent px-3 py-2 text-xs font-semibold">
                    {caption}
                  </figcaption>
                ) : null}
              </figure>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-lg bg-card px-4 py-2 text-xs font-semibold press border-2 border-ink">
                {imageFile ? "Change photo" : "Choose photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) {
                      setError("That image is larger than 10MB.");
                      return;
                    }
                    setError(null);
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }}
                />
              </label>
              {imageFile ? (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    setCaption("");
                  }}
                  className="rounded-lg bg-card px-4 py-2 text-xs font-semibold press border-2 border-ink"
                >
                  Remove
                </button>
              ) : null}
            </div>

            {imageFile ? (
              <label className="mt-3 block">
                <span className="mb-1.5 block text-xs font-semibold text-mute">Photo caption</span>
                <input
                  maxLength={140}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className={inputClass}
                />
              </label>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-mute">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                {(categories.data ?? []).map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-mute">Type</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as GiveawayType)}
                className={inputClass}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-mute">Location (optional)</span>
              <input
                maxLength={90}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Yaba, Lagos"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-mute">How many recipients?</span>
              <input
                inputMode="numeric"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value.replace(/[^0-9]/g, ""))}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-mute">Closes on (optional)</span>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={inputClass}
            />
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full press rounded-lg bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Publishing…" : "Publish giveaway"}
          </button>
        </form>
      </section>
    </AppShell>
  );
}
