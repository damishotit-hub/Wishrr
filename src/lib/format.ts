export function naira(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0);
  return "₦" + Math.round(value).toLocaleString("en-NG");
}

export function progressPercent(raised: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function daysLeft(deadline: string | null | undefined): string | null {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (diff < 0) return "deadline passed";
  if (diff === 0) return "last day";
  if (diff === 1) return "1 day left";
  return `${diff} days left`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "W";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const CATEGORY_LABELS: Record<string, string> = {
  education: "Education",
  family: "Family",
  emergency: "Emergency",
  business: "Business",
  technology: "Technology",
  personal: "Personal",
  creative: "Creative",
  other: "Other",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_verification: "Pending verification",
  active: "Active",
  partially_funded: "Partially funded",
  fulfilled: "Fulfilled",
  closed: "Closed",
};
