export type BrowserSignals = {
  userAgent: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  timezone: string;
  hardwareConcurrency: number;
  maxTouchPoints: number;
};

// Versioned, site-scoped, lightweight signals only: no canvas, fonts, IP or location.
export async function hashBrowserSignals(signals: BrowserSignals): Promise<string> {
  const dimensions = [signals.screenWidth, signals.screenHeight].sort((a, b) => a - b);
  const input = JSON.stringify([
    "wishr:signup-browser:v1", signals.userAgent, signals.language, dimensions,
    signals.colorDepth, signals.timezone, signals.hardwareConcurrency, signals.maxTouchPoints,
  ]);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function bestEffortFingerprint(generate: () => Promise<string>): Promise<string | null> {
  try { return await generate(); } catch { return null; }
}

// Called only from submit handlers and effects, never during SSR or render.
export function getDeviceFingerprint(): Promise<string | null> {
  return bestEffortFingerprint(() => hashBrowserSignals({
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hardwareConcurrency: navigator.hardwareConcurrency ?? 0,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
  }));
}