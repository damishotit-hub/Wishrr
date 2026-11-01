import QRCode from "qrcode";
import logo from "@/assets/wishr-logo.png.asset.json";
import { naira, progressPercent } from "@/lib/format";
import type { Wish } from "@/lib/queries";

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function linesFor(ctx: CanvasRenderingContext2D, text: string, width: number, limit: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    // Split unusually long unbroken titles so they cannot escape the canvas.
    for (const part of word.match(/.{1,22}/gu) ?? []) {
      const next = line ? `${line} ${part}` : part;
      if (ctx.measureText(next).width > width && line) {
        lines.push(line);
        line = part;
      } else line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length > limit) {
    lines.length = limit;
    let last = lines[limit - 1] ?? "";
    while (ctx.measureText(`${last}…`).width > width && last) last = last.slice(0, -1);
    lines[limit - 1] = `${last}…`;
  }
  return lines;
}

/** Browser-only rendering: share artwork uses the same semantic theme as the app. */
export async function renderWishStory(wish: Wish, url: string): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't create the card.");
  const css = getComputedStyle(document.documentElement);
  const color = (name: string) => css.getPropertyValue(name).trim();
  const paper = color("--card"), ink = color("--card-foreground");
  const teal = color("--primary"), mint = color("--secondary"), lime = color("--accent");
  const soft = color("--muted"), muted = color("--muted-foreground");
  const box = (x: number, y: number, width: number, height: number, radius: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fill();
  };
  ctx.fillStyle = paper; ctx.fillRect(0, 0, 1080, 1920);
  const [brand, photo] = await Promise.all([loadImage(logo.url), wish.image_url ? loadImage(wish.image_url) : Promise.resolve(null)]);
  if (brand) ctx.drawImage(brand, 72, 72, 280, 280 * brand.height / brand.width);
  box(768, 91, 240, 52, 26, lime);
  ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.font = "700 23px 'Plus Jakarta Sans'";
  ctx.fillText(wish.status === "fulfilled" ? "WISH GRANTED" : "A LITTLE KINDNESS", 888, 125);
  ctx.save();
  ctx.beginPath(); ctx.roundRect(48, 220, 984, 700, 32); ctx.clip();
  if (photo) {
    const ratio = Math.max(984 / photo.width, 700 / photo.height);
    const sw = 984 / ratio, sh = 700 / ratio;
    ctx.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) / 2, sw, sh, 48, 220, 984, 700);
  } else {
    ctx.fillStyle = soft; ctx.fillRect(48, 220, 984, 700);
    box(128, 320, 824, 8, 4, mint);
    ctx.fillStyle = ink; ctx.textAlign = "left"; ctx.font = "800 100px 'Plus Jakarta Sans'";
    ctx.fillText("One wish.", 128, 520); ctx.fillText("So much", 128, 640); ctx.fillText("possibility.", 128, 760);
  }
  ctx.restore();
  ctx.textAlign = "left"; ctx.fillStyle = muted; ctx.font = "600 26px Inter";
  const by = wish.is_anonymous ? "A wish from the community" : `A wish by ${wish.creator_display_name}`;
  ctx.fillText(linesFor(ctx, by, 936, 1)[0] ?? "", 72, 986);
  ctx.fillStyle = ink; ctx.font = "800 64px 'Plus Jakarta Sans'";
  linesFor(ctx, wish.title, 936, 3).forEach((line, i) => ctx.fillText(line, 72, 1080 + i * 80));
  const raised = Number(wish.amount_raised), goal = Number(wish.goal_amount);
  const percent = progressPercent(raised, goal);
  box(48, 1328, 984, 264, 24, soft);
  ctx.fillStyle = ink; ctx.font = "800 52px 'Plus Jakarta Sans'"; ctx.fillText(naira(raised), 88, 1408);
  ctx.fillStyle = muted; ctx.font = "500 26px Inter"; ctx.fillText("raised with kindness", 88, 1452);
  ctx.textAlign = "right"; ctx.fillStyle = ink; ctx.font = "700 30px Inter"; ctx.fillText(`${percent}%`, 992, 1408);
  ctx.fillStyle = muted; ctx.font = "500 26px Inter"; ctx.fillText(`of ${naira(goal)}`, 992, 1452);
  box(88, 1484, 904, 18, 9, paper);
  if (percent > 0) box(88, 1484, Math.max(18, 904 * percent / 100), 18, 9, teal);
  ctx.textAlign = "left"; ctx.fillStyle = ink; ctx.font = "600 24px Inter";
  ctx.fillText(wish.status === "fulfilled" ? "Proof that kindness makes things happen." : `${naira(Math.max(0, goal - raised))} to make this wish happen.`, 88, 1550);
  // Convert semantic colors to QR-compatible hex without duplicating palette values.
  const hex = (value: string) => {
    const pixel = document.createElement("canvas").getContext("2d");
    if (!pixel) throw new Error("Couldn't create the wish link.");
    pixel.fillStyle = value; pixel.fillRect(0, 0, 1, 1);
    const channels = pixel.getImageData(0, 0, 1, 1).data;
    return `#${Array.from(channels).slice(0, 3).map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  };
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, url, { width: 176, margin: 1, errorCorrectionLevel: "M", color: { dark: hex(ink), light: hex(paper) } });
  ctx.drawImage(qr, 832, 1660, 176, 176);
  ctx.fillStyle = ink; ctx.font = "800 44px 'Plus Jakarta Sans'";
  ctx.fillText(wish.status === "fulfilled" ? "Kindness came through." : "Make it happen.", 72, 1716);
  ctx.fillStyle = muted; ctx.font = "500 26px Inter"; ctx.fillText("Every little bit means a lot.", 72, 1762);
  ctx.font = "600 24px Inter"; ctx.fillStyle = ink;
  linesFor(ctx, url.replace(/^https?:\/\//, ""), 710, 2).forEach((line, i) => ctx.fillText(line, 72, 1820 + i * 32));
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Couldn't save the card.")), "image/png"));
}