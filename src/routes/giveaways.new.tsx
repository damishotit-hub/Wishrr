import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/wishr/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { GIVEAWAY_CATEGORIES, GIVEAWAY_CATEGORY_LABELS, MODE_CTA, MODE_LABEL, SELECTION_MODES, type SelectionMode } from "@/lib/giveaways";

export const Route = createFileRoute("/giveaways/new")({
  head: () => ({
    meta: [
      { title: "Create a giveaway - Wishr" },
      { name: "description", content: "Offer something you no longer need to someone on Wishr who does." },
      { property: "og:title", content: "Create a giveaway - Wishr" },
      { property: "og:description", content: "Offer something you no longer need to someone on Wishr who does." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewGiveaway,
});

const inputClass =
  "w-full rounded-lg border-2 border-ink bg-canvas px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-primary";
const MAX = 10 * 1024 * 1024;

function NewGiveaway() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [mode, setMode] = useState<SelectionMode>("giver_selects");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [recipients, setRecipients] = useState("1");
  const [eligibility, setEligibility] = useState("");
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <AppShell><div className="mt-8 h-64 shimmer rounded-lg" /></AppShell>;

  if (!user) {
    return (
      <AppShell>
        <section className="mx-auto max-w-md pt-12 text-center">
          <h1 className="font-display text-3xl">Sign in to give something</h1>
          <p className="mt-2 text-sm text-mute">We ask for an account so people can reach you about your giveaway.</p>
          <Link to="/auth" className="mt-6 inline-block press rounded-lg bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground">Sign in or create account</Link>
        </section>
      </AppShell>
    );
  }

  const mainPreview = mainFile ? URL.createObjectURL(mainFile) : null;

  async function upload(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
    const { error: e1 } = await supabase.storage.from("wish-images").upload(path, file, { contentType: file.type });
    if (e1) throw e1;
    const { data, error: e2 } = await supabase.storage.from("wish-images").createSignedUrl(path, 60 * 60 * 24 * 3650);
    if (e2) throw e2;
    return data.signedUrl;
  }

  function validate() {
    if (title.trim().length < 3) return "Give it a short title.";
    if (description.trim().length < 10) return "Add a few more details.";
    if (!mainFile) return "Add a main photo.";
    return null;
  }

  async function publish(asDraft: boolean) {
    setBusy(true); setError(null);
    try {
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user!.id).maybeSingle();
      const imageUrl = mainFile ? await upload(mainFile) : null;
      const extras: string[] = [];
      for (const f of extraFiles) extras.push(await upload(f));
      const { data, error: insertError } = await supabase.from("giveaways").insert({
        giver_id: user!.id,
        giver_display_name: profile?.display_name ?? user!.email?.split("@")[0] ?? "A giver",
        title: title.trim(),
        description: description.trim(),
        category,
        selection_mode: mode,
        location: location.trim() || null,
        deadline: deadline || null,
        recipient_count: Math.max(1, Number(recipients) || 1),
        eligibility: eligibility.trim() || null,
        image_url: imageUrl,
        image_caption: imageUrl && caption.trim() ? caption.trim() : null,
        extra_images: extras,
        status: asDraft ? "draft" : "active",
      }).select("id").single();
      if (insertError) throw insertError;
      await queryClient.invalidateQueries({ queryKey: ["giveaways"] });
      await queryClient.invalidateQueries({ queryKey: ["my-giveaways"] });
      await navigate({ to: "/giveaways/$id", params: { id: data.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't publish that giveaway.");
    } finally { setBusy(false); }
  }

  if (previewing) {
    return (
      <AppShell>
        <section className="mx-auto max-w-2xl pt-8">
          <p className="eyebrow">Preview</p>
          <h1 className="mt-1 font-display text-3xl">This is how it will look</h1>
          <article className="mt-5 card-frame overflow-hidden">
            {mainPreview ? <img src={mainPreview} alt="" className="aspect-[16/10] w-full border-b-2 border-ink object-cover" /> : null}
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                <span className="pill">{GIVEAWAY_CATEGORY_LABELS[category]}</span>
                <span className="pill-accent">{MODE_LABEL[mode]}</span>
              </div>
              <h2 className="mt-3 font-display text-2xl">{title}</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-ink/90">{description}</p>
              <p className="mt-3 text-xs text-mute">{location || "No location"} · {recipients} recipient(s){deadline ? ` · closes ${deadline}` : ""}</p>
              {eligibility ? <p className="mt-3 card-flat p-3 text-sm"><b>Eligibility / pickup:</b> {eligibility}</p> : null}
              <span className="mt-4 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">{MODE_CTA[mode]}</span>
            </div>
          </article>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <button onClick={() => setPreviewing(false)} disabled={busy} className="press rounded-lg border-2 border-ink bg-card px-4 py-3 text-sm font-semibold">Edit</button>
            <button onClick={() => publish(true)} disabled={busy} className="press rounded-lg border-2 border-ink bg-accent px-4 py-3 text-sm font-semibold text-ink">Save as draft</button>
            <button onClick={() => publish(false)} disabled={busy} className="press rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Publishing..." : "Publish giveaway"}</button>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-2xl pt-8">
        <h1 className="font-display text-3xl">Create a giveaway</h1>
        <p className="mt-2 text-sm text-mute">Sometimes you have something someone else needs. Describe it plainly.</p>

        <form
          onSubmit={(e) => { e.preventDefault(); const v = validate(); setError(v); if (!v) setPreviewing(true); }}
          className="mt-6 space-y-4 card-frame p-5"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-mute">Title</span>
            <input required maxLength={90} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gently used school desk and chair" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-mute">Description</span>
            <textarea required rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Condition, size, who it would suit." className={`${inputClass} resize-y`} />
          </label>

          <div className="card-flat p-4">
            <span className="eyebrow">Photos</span>
            <p className="mt-1 text-xs text-mute">Main photo required. Up to 4 extra photos (optional). Max 10MB each.</p>
            {mainPreview ? <img src={mainPreview} alt="Main" className="mt-3 aspect-[16/10] w-full rounded-lg border-2 border-ink object-cover" /> : null}
            <label className="mt-3 inline-block cursor-pointer rounded-lg border-2 border-ink bg-card px-4 py-2 text-xs font-semibold press">
              {mainFile ? "Change main photo" : "Choose main photo"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]; if (!f) return;
                if (f.size > MAX) return setError("That image is larger than 10MB.");
                setError(null); setMainFile(f);
              }} />
            </label>
            {mainFile ? (
              <label className="mt-3 block">
                <span className="mb-1.5 block text-xs font-semibold text-mute">Photo caption (optional)</span>
                <input maxLength={140} value={caption} onChange={(e) => setCaption(e.target.value)} className={inputClass} />
              </label>
            ) : null}
            <label className="mt-3 block text-xs font-semibold text-mute">Extra photos (optional)
              <input type="file" accept="image/*" multiple className="mt-2 block w-full text-sm" onChange={(e) => {
                const files = Array.from(e.target.files ?? []).filter((f) => f.size <= MAX).slice(0, 4);
                setExtraFiles(files);
              }} />
            </label>
            {extraFiles.length ? <p className="mt-1 text-xs text-mute">{extraFiles.length} extra photo(s) selected</p> : null}
          </div>

          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold text-mute">Giveaway type</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {SELECTION_MODES.map((m) => (
                <button type="button" key={m.value} onClick={() => setMode(m.value)}
                  className={`press rounded-lg border-2 border-ink p-3 text-left ${mode === m.value ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                  <span className="block text-sm font-semibold">{m.label}</span>
                  <span className="mt-1 block text-xs opacity-80">{m.help}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-mute">Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                {GIVEAWAY_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-mute">Location (city, state)</span>
              <input maxLength={90} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Yaba, Lagos" className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-mute">Number of recipients</span>
              <input inputMode="numeric" value={recipients} onChange={(e) => setRecipients(e.target.value.replace(/[^0-9]/g, ""))} className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-mute">Deadline (optional)</span>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-mute">Eligibility / pickup instructions (optional)</span>
            <textarea rows={3} maxLength={600} value={eligibility} onChange={(e) => setEligibility(e.target.value)} placeholder="Students only. Pickup in Yaba on weekends." className={`${inputClass} resize-y`} />
            <span className="mt-1 block text-[11px] text-mute">Shown publicly. Share exact addresses privately with your recipient later.</span>
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button type="submit" className="w-full press rounded-lg bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground">Preview giveaway</button>
        </form>
      </section>
    </AppShell>
  );
}
