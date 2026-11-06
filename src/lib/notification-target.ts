export function notificationTarget(link: string | null) {
  const match = link?.match(/^\/(wish|messages|giveaways)\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
  if (!match?.[2]) return null;
  const id = match[2];
  if (match[1] === "wish") return { to: "/wish/$id", params: { id }, kind: "wish" } as const;
  if (match[1] === "messages") return { to: "/messages/$id", params: { id }, kind: "message" } as const;
  if (match[1] === "giveaways") return { to: "/giveaways/$id", params: { id }, kind: "giveaway" } as const;
  return null;
}