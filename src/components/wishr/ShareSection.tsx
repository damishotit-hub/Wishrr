import { useState } from "react";
import logo from "@/assets/wishr-logo.png.asset.json";
import { naira, progressPercent } from "@/lib/format";
import type { Wish } from "@/lib/queries";


function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number, lines: number) {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > max && line) {
      out.push(line);
      line = w;
      if (out.length === lines) break;
    } else line = test;
  }
  if (out.length < lines && line) out.push(line);
  if (out.length === lines && words.join(" ") !== out.join(" ")) out[lines - 1] = (out[lines - 1] ?? "").replace(/\s*\S*$/, "...");
  return out;
}

async function renderCard(wish: Wish, url: string): Promise<Blob | null> {
  await document.fonts?.ready;
  const W = 1080, H = 1920;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const css = getComputedStyle(document.documentElement);
  const teal = "#00A88F", deep = "#004040", mint = "#E8F5F2", lime = "#A7E22E";
  void css;
  ctx.fillStyle = mint; ctx.fillRect(0, 0, W, H);

  const logoImg = await loadImage(logo.url);
  if (logoImg) {
    const lh = 110, lw = (logoImg.width / logoImg.height) * lh;
    ctx.drawImage(logoImg, (W - lw) / 2, 90, lw, lh);
  }

  // card frame with hard shadow
  const x = 80, y = 260, cw = W - 160, ch = 1380;
  ctx.fillStyle = deep; ctx.fillRect(x + 18, y + 18, cw, ch);
  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(x, y, cw, ch);
  ctx.lineWidth = 8; ctx.strokeStyle = deep; ctx.strokeRect(x, y, cw, ch);

  const imgH = 620;
  const img = wish.image_url ? await loadImage(wish.image_url) : null;
  if (img) {
    const r = Math.max(cw / img.width, imgH / img.height);
    const sw = cw / r, sh = imgH / r;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, cw, imgH);
  } else {
    ctx.fillStyle = teal; ctx.fillRect(x, y, cw, imgH);
    ctx.fillStyle = "#FFFFFF"; ctx.font = "700 80px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center"; ctx.fillText("Make a wish.", x + cw / 2, y + imgH / 2 + 28);
  }
  ctx.textAlign = "left";
  ctx.beginPath(); ctx.moveTo(x, y + imgH); ctx.lineTo(x + cw, y + imgH); ctx.stroke();

  ctx.fillStyle = deep;
  ctx.font = "700 72px 'Plus Jakarta Sans', sans-serif";
  const lines = wrap(ctx, wish.title, cw - 100, 3);
  lines.forEach((l, i) => ctx.fillText(l, x + 50, y + imgH + 120 + i * 86));

  const raised = Number(wish.amount_raised), goal = Number(wish.goal_amount);
  const pct = progressPercent(raised, goal);
  const by = y + ch - 300;
  ctx.font = "600 44px Inter, sans-serif";
  ctx.fillText(`${naira(raised)} raised`, x + 50, by);
  ctx.textAlign = "right"; ctx.fillStyle = "#3d6b6b";
  ctx.fillText(`of ${naira(goal)}`, x + cw - 50, by); ctx.textAlign = "left";
  const bx = x + 50, bw = cw - 100, bh = 50, bty = by + 40;
  ctx.fillStyle = mint; ctx.fillRect(bx, bty, bw, bh);
  ctx.fillStyle = teal; ctx.fillRect(bx, bty, (bw * pct) / 100, bh);
  ctx.lineWidth = 6; ctx.strokeStyle = deep; ctx.strokeRect(bx, bty, bw, bh);
  ctx.fillStyle = deep; ctx.font = "700 40px Inter, sans-serif";
  ctx.fillText(wish.status === "fulfilled" ? "Wish granted!" : `${pct}% of the way there`, bx, bty + bh + 70);

  // CTA pill
  ctx.fillStyle = lime; ctx.fillRect(140, 1720, W - 280, 110);
  ctx.lineWidth = 6; ctx.strokeRect(140, 1720, W - 280, 110);
  ctx.fillStyle = deep; ctx.textAlign = "center";
  ctx.font = "700 40px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Help make it happen", W / 2, 1768);
  ctx.font = "500 30px Inter, sans-serif";
  ctx.fillText(url.replace(/^https?:\/\//, ""), W / 2, 1810);

  return new Promise((res) => c.toBlob((b) => res(b), "image/png"));
}

export function ShareSection({ wish }: { wish: Wish }) {
  const site = typeof window !== "undefined" ? window.location.origin : "https://wishrr.lovable.app";
  const url = `${site}/wish/${wish.id}`;
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const message =
    wish.status === "fulfilled"
      ? `This wish came true on Wishr: "${wish.title}". See the story: ${url}`
      : `Help make this wish happen on Wishr: "${wish.title}". Every bit counts. ${url}`;

  async function generate() {
    setBusy(true); setNote(null);
    const b = await renderCard(wish, url);
    setBusy(false);
    if (!b) { setNote("We couldn't create the card. Please try again."); return; }
    setBlob(b);
    setPreview(URL.createObjectURL(b));
  }

  async function shareImage() {
    if (!blob) return;
    const file = new File([blob], "wishr-story.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], text: message }); } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setNote("Card copied. Paste it into WhatsApp or Instagram.");
      } catch { setNote("Download the card, then post it to your Status or Story."); }
    }
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(url); setNote("Link copied."); } catch { setNote(url); }
  }

  return (
    <section className="card-frame p-5">
      <p className="eyebrow">Spread the word</p>
      <h2 className="mt-1 font-display text-xl">Share this wish</h2>
      <div className="mt-4 grid gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="press rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
        >
          Share to WhatsApp
        </a>
        <button onClick={generate} disabled={busy} className="press rounded-lg border-2 border-ink bg-accent px-4 py-3 text-sm font-semibold text-ink disabled:opacity-60">
          {busy ? "Creating card..." : "Generate Story Card"}
        </button>
        <button onClick={copyLink} className="press rounded-lg border-2 border-ink bg-card px-4 py-3 text-sm font-semibold text-ink">
          Copy link
        </button>
      </div>
      {note ? <p className="mt-3 text-xs text-mute" role="status">{note}</p> : null}

      {preview ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4" role="dialog" aria-modal="true" aria-label="Story card">
          <div className="pop-in card-frame w-full max-w-sm bg-card p-4">
            <img src={preview} alt="Story card preview" className="mx-auto max-h-[60vh] w-auto border-2 border-ink" />
            <div className="mt-4 grid gap-2">
              <a href={preview} download="wishr-story.png" className="press rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground">Download card</a>
              <button onClick={shareImage} className="press rounded-lg border-2 border-ink bg-accent px-4 py-3 text-sm font-semibold text-ink">Share or copy image</button>
              <button onClick={() => { setPreview(null); }} className="press rounded-lg border-2 border-ink bg-card px-4 py-3 text-sm font-semibold text-ink">Close</button>
            </div>
            {note ? <p className="mt-3 text-xs text-mute">{note}</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
