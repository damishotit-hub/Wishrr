export type MemberRecognition = "giver" | "receiver";

// Use only activity already visible to the viewer, never private transfers.
export function memberRecognitions(hasWishes: boolean, hasGiveaways: boolean): MemberRecognition[] {
  const labels: MemberRecognition[] = [];
  if (hasGiveaways) labels.push("giver");
  if (hasWishes) labels.push("receiver");
  return labels;
}