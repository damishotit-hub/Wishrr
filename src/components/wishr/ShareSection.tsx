import { useEffect, useState } from "react";
import { Copy, Download, ImagePlus, LoaderCircle, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { renderWishStory } from "@/lib/wish-story";
import type { Wish } from "@/lib/queries";

export function ShareSection({ wish }: { wish: Wish }) {
  const site = typeof window !== "undefined" ? window.location.origin : "https://wishrr.lovable.app";
  const url = `${site}/wish/${wish.id}`;
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const message = wish.status === "fulfilled"
    ? `This wish came true on Wishr: "${wish.title}". See the story: ${url}`
    : `Help make this wish happen on Wishr: "${wish.title}". Every bit counts. ${url}`;

  async function generate() {
    setBusy(true); setNote(null);
    try {
      const image = await renderWishStory(wish, url);
      setBlob(image); setPreview(URL.createObjectURL(image));
    } catch (error) {
      setNote(error instanceof Error ? error.message : "We couldn't create the card. Please try again.");
    } finally { setBusy(false); }
  }
  async function shareImage() {
    if (!blob) return;
    const file = new File([blob], "wishr-story.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], text: message }); }
      catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setNote("Download the card to share it instead."); }
    } else {
      try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); setNote("Card copied. Ready to share."); }
      catch { setNote("Download the card, then post it to your Status or Story."); }
    }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(url); setNote("Link copied."); }
    catch { setNote(url); }
  }
  return (
    <section className="share-surface py-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary/30 text-ink"><Share2 className="size-5" aria-hidden="true" /></span>
        <div><p className="eyebrow">A little kindness travels</p><h2 className="mt-1 font-display text-xl">Share this wish</h2></div>
      </div>
      <div className="mt-5 grid gap-3">
        <Button asChild className="h-12 rounded-lg font-semibold"><a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"><MessageCircle />Share to WhatsApp</a></Button>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button onClick={generate} disabled={busy} variant="outline" className="h-12 rounded-lg bg-card font-semibold">{busy ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}{busy ? "Creating card…" : "Generate Story Card"}</Button>
          <Button onClick={copyLink} variant="outline" size="icon" className="size-12 rounded-lg bg-card" aria-label="Copy wish link" title="Copy wish link"><Copy /></Button>
        </div>
      </div>
      {!preview && note ? <p className="mt-3 break-all text-xs text-mute" role="status">{note}</p> : null}
      <Dialog open={!!preview} onOpenChange={(open) => { if (!open) { setPreview(null); setNote(null); } }}>
        <DialogContent className="max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-sm overflow-y-auto rounded-lg border-line bg-card p-5">
          <div><DialogTitle className="font-display">Your wish, worth sharing.</DialogTitle><DialogDescription className="mt-2">A little kindness travels.</DialogDescription></div>
          {preview ? <img src={preview} alt={`Wishr story card for ${wish.title}`} className="mx-auto max-h-[52dvh] w-auto rounded-lg object-contain" /> : null}
          <div className="grid gap-2">
            <Button asChild className="h-11 font-semibold"><a href={preview ?? undefined} download="wishr-story.png"><Download />Download card</a></Button>
            <Button onClick={shareImage} variant="outline" className="h-11"><Share2 />Share or copy image</Button>
          </div>
          {note ? <p className="break-all text-xs text-mute" role="status">{note}</p> : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
