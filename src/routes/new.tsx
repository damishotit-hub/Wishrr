import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/wishr/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { categoriesQuery } from "@/lib/queries";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "Make a wish - Wishr" },
      {
        name: "description",
        content: "Say what you need, set a goal in Naira, and let people help you get there.",
      },
      { property: "og:title", content: "Make a wish - Wishr" },
      {
        property: "og:description",
        content: "Say what you need, set a goal in Naira, and let people help you get there.",
      },
    ],
  }),
  component: NewWish,
});

const inputClass =
  "w-full rounded-lg border-2 border-ink bg-canvas px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-primary";


function NewWish() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const categories = useQuery(categoriesQuery);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("education");
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);


  if (loading) {
    return (
      <AppShell>
        <div className="h-64 animate-pulse rounded-[20px] bg-warm/50" />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <section className="mx-auto max-w-md pt-12 text-center">
          <h1 className="font-display text-3xl">Sign in to make a wish</h1>
          <p className="mt-2 text-sm text-mute">
            We ask for an account so wishers can be reached and updates stay honest.
          </p>
          <Link
            to="/auth"
            className="mt-6 inline-block rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground"
          >
            Sign in or create account
          </Link>
        </section>
      </AppShell>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const goalValue = Math.round(Number(goal));
    if (!Number.isFinite(goalValue) || goalValue < 1000) {
      setError("Set a goal of at least ₦1,000.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const displayName =
        (user!.user_metadata?.["display_name"] as string | undefined) ??
        user!.email?.split("@")[0] ??
        "A wisher";

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

      const { data, error: insertError } = await supabase
        .from("wishes")
        .insert({
          user_id: user!.id,
          title: title.trim(),
          summary: summary.trim() || null,
          description: description.trim(),
          category,
          goal_amount: goalValue,
          deadline: deadline || null,
          is_anonymous: anonymous,
          creator_display_name: anonymous ? "Anonymous" : displayName,
          image_url: imageUrl,
          image_caption: imageUrl && caption.trim() ? caption.trim() : null,
          status: "active",
        })
        .select("id")
        .single();
      if (insertError) throw insertError;


      await queryClient.invalidateQueries({ queryKey: ["wishes"] });
      await queryClient.invalidateQueries({ queryKey: ["my-wishes"] });
      await navigate({ to: "/wish/$id", params: { id: data.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't publish that wish.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-2xl pt-8">
        <h1 className="font-display text-3xl">Make a wish</h1>
        <p className="mt-2 text-sm text-mute">
          Be specific and honest. People give to wishes they can picture.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4 rounded-[20px] bg-card p-5 ring-1 ring-line">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-mute">Wish title</span>
            <input
              required
              maxLength={90}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sewing machine to restart my tailoring work"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-mute">
              One-line summary (optional)
            </span>
            <input
              maxLength={140}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-mute">Your story</span>
            <textarea
              required
              rows={7}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What do you need, why does it matter, and what changes when it happens?"
              className={`${inputClass} resize-y`}
            />
          </label>

          <div className="card-flat p-4">
            <span className="eyebrow">Photo</span>
            <p className="mt-1 text-xs text-mute">
              A clear picture of what you need. Max 10MB.
            </p>

            {imagePreview ? (
              <figure className="mt-3 overflow-hidden rounded-lg border-2 border-ink">
                <img src={imagePreview} alt="Selected wish" className="aspect-[16/10] w-full object-cover" />
                {caption.trim() ? (
                  <figcaption className="border-t-2 border-ink bg-accent px-3 py-2 text-xs font-semibold">
                    {caption}
                  </figcaption>
                ) : null}
              </figure>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-lg bg-card px-4 py-2 text-xs font-semibold press">
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
                  className="rounded-lg bg-card px-4 py-2 text-xs font-semibold press"
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
                  placeholder="The machine I use for orders"
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
              <span className="mb-1.5 block text-xs font-semibold text-mute">Goal (₦)</span>
              <input
                required
                inputMode="numeric"
                value={goal}
                onChange={(e) => setGoal(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="150000"
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-mute">
              Deadline (optional)
            </span>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex items-center gap-2.5 text-sm text-mute">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            Post this wish anonymously
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Publishing…" : "Publish wish"}
          </button>
        </form>
      </section>
    </AppShell>
  );
}
