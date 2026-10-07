import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/wishr/AppShell";
import { REASON_LABEL } from "@/components/wishr/ReportButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { myRolesQuery } from "@/lib/queries";
import { naira, timeAgo, STATUS_LABELS } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin - Wishr" },
      { name: "description", content: "Wishr moderation and platform overview." },
      { property: "og:title", content: "Admin - Wishr" },
      { property: "og:description", content: "Wishr moderation and platform overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const TABS = ["Overview", "Reports", "Wishes", "Giveaways", "Users", "Team"] as const;
type Tab = (typeof TABS)[number];
const small = "press rounded-lg px-2.5 py-1.5 text-xs font-semibold";

function AdminPage() {
  const { user, loading } = useAuth();
  const roles = useQuery({ ...myRolesQuery(user?.id ?? ""), enabled: !!user });
  const [tab, setTab] = useState<Tab>("Overview");

  if (loading || (user && roles.isPending)) return <AppShell><div className="mt-8 h-40 animate-pulse rounded-[14px] bg-warm" /></AppShell>;
  const isAdmin = !!roles.data?.includes("admin");
  const isMod = !!roles.data?.includes("moderator");
  if (!user || (!isAdmin && !isMod)) {
    return (
      <AppShell>
        <section className="mx-auto max-w-xl py-16 text-center">
          <p className="eyebrow">Admin</p>
          <h1 className="mt-3 font-display text-3xl">This area is for the Wishr team.</h1>
          <p className="mt-3 text-sm text-mute">{user ? "Your account doesn't have admin access." : "Sign in with an admin account to continue."}</p>
          <Link to={user ? "/" : "/auth"} className="press mt-6 inline-block rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{user ? "Go home" : "Sign in"}</Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pt-6">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-1 font-display text-3xl">Moderation</h1>
        {!isAdmin ? <p className="mt-2 text-sm text-mute">You're signed in as a moderator. You can review reports and act on reported wishes and giveaways.</p> : null}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {(isAdmin ? TABS : (["Reports"] as const)).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`press shrink-0 rounded-lg border-2 border-ink px-3 py-1.5 text-sm font-semibold ${tab === t ? "bg-primary text-primary-foreground" : "bg-card"}`}>{t}</button>
          ))}
        </div>
        <div className="mt-6">
          {!isAdmin ? <Reports /> : tab === "Team" ? <Team /> : tab === "Overview" ? <Overview /> : tab === "Reports" ? <Reports /> : tab === "Wishes" ? <Wishes /> : tab === "Giveaways" ? <Giveaways /> : <Users />}
        </div>
      </div>
    </AppShell>
  );
}

async function count(table: "wishes" | "giveaways" | "profiles" | "giveaway_entries" | "wish_offers", filter?: (q: any) => any) {
  let q: any = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c ?? 0;
}

function Overview() {
  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [members, wishes, active, granted, giveaways, entries, offers, openReports, contribs] = await Promise.all([
        count("profiles"), count("wishes"), count("wishes", (q) => q.in("status", ["active", "partially_funded"])),
        count("wishes", (q) => q.eq("status", "fulfilled")), count("giveaways"), count("giveaway_entries"), count("wish_offers"),
        supabase.from("content_reports").select("id", { count: "exact", head: true }).in("status", ["open", "reviewing"]).then((r) => r.count ?? 0),
        supabase.from("contributions").select("amount").eq("payment_status", "succeeded").then((r) => (r.data ?? []).reduce((s, x) => s + Number(x.amount), 0)),
      ]);
      return { members, wishes, active, granted, giveaways, entries, offers, openReports, contribs };
    },
  });
  const s = stats.data;
  const items: [string, string | number][] = s ? [
    ["Members", s.members], ["Wishes", s.wishes], ["Active wishes", s.active], ["Wishes granted", s.granted],
    ["Confirmed giving", naira(s.contribs)], ["Giveaways", s.giveaways], ["Giveaway entries", s.entries],
    ["Item offers", s.offers], ["Open reports", s.openReports],
  ] : [];
  if (stats.isPending) return <div className="h-40 animate-pulse rounded-[14px] bg-warm" />;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k} className="card-frame p-4"><p className="text-xs font-semibold text-mute">{k}</p><p className="mt-1 font-display text-2xl">{v}</p></div>
      ))}
    </div>
  );
}

function Reports() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"open" | "all">("open");
  const reports = useQuery({
    queryKey: ["admin", "reports", filter],
    queryFn: async () => {
      let q = supabase.from("content_reports").select("*, wishes(id,title,status), giveaways(id,title,status)").order("created_at", { ascending: false }).limit(100);
      if (filter === "open") q = q.in("status", ["open", "reviewing"]);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
  async function resolve(id: string, status: "resolved" | "dismissed") {
    await supabase.from("content_reports").update({ status }).eq("id", id);
    await qc.invalidateQueries({ queryKey: ["admin"] });
  }
  return (
    <div>
      <div className="mb-3 flex gap-2">
        {(["open", "all"] as const).map((f) => <button key={f} onClick={() => setFilter(f)} className={`${small} border-2 border-ink ${filter === f ? "bg-secondary" : "bg-card"}`}>{f === "open" ? "Needs review" : "All reports"}</button>)}
      </div>
      {!reports.data?.length ? <p className="text-sm text-mute">{reports.isPending ? "Loading..." : "No reports to review."}</p> : (
        <ul className="space-y-3">
          {reports.data.map((r) => {
            const target = r.target_type === "wish" ? r.wishes : r.giveaways;
            return (
              <li key={r.id} className="card-frame p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill">{REASON_LABEL[r.reason] ?? r.reason}</span>
                  <span className="pill-outline">{r.target_type}</span>
                  <span className="text-[11px] text-mute">{r.status} · {timeAgo(r.created_at)}</span>
                </div>
                <p className="mt-2 text-sm font-semibold">
                  {target ? (r.target_type === "wish"
                    ? <Link to="/wish/$id" params={{ id: target.id }} className="underline">{target.title}</Link>
                    : <Link to="/giveaways/$id" params={{ id: target.id }} className="underline">{target.title}</Link>) : "Removed"}
                  {target ? <span className="ml-2 text-xs font-normal text-mute">({target.status})</span> : null}
                </p>
                {r.details ? <p className="mt-1 text-sm text-mute">{r.details}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {target ? <ModActions kind={r.target_type as "wish" | "giveaway"} id={target.id} /> : null}
                  {r.status === "open" || r.status === "reviewing" ? <>
                    <button onClick={() => resolve(r.id, "resolved")} className={`${small} border-2 border-ink bg-accent text-ink`}>Mark resolved</button>
                    <button onClick={() => resolve(r.id, "dismissed")} className={`${small} border-2 border-ink bg-card`}>Dismiss</button>
                  </> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ModActions({ kind, id }: { kind: "wish" | "giveaway"; id: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function run(action: "approve" | "hide" | "remove") {
    if (action === "remove" && !window.confirm(`Permanently remove this ${kind}? This can't be undone.`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("moderate_content", { _kind: kind, _id: id, _action: action });
    if (error) window.alert(error.message);
    setBusy(false);
    await qc.invalidateQueries();
  }
  return <>
    <button disabled={busy} onClick={() => run("approve")} className={`${small} bg-primary text-primary-foreground`}>Approve</button>
    <button disabled={busy} onClick={() => run("hide")} className={`${small} border-2 border-ink bg-card`}>Hide</button>
    <button disabled={busy} onClick={() => run("remove")} className={`${small} border-2 border-ink bg-destructive text-destructive-foreground`}>Remove</button>
  </>;
}

function Wishes() {
  const wishes = useQuery({
    queryKey: ["admin", "wishes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wishes").select("id,title,status,creator_display_name,goal_amount,amount_raised,created_at").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
  if (!wishes.data?.length) return <p className="text-sm text-mute">{wishes.isPending ? "Loading..." : "No wishes yet."}</p>;
  return (
    <ul className="space-y-3">
      {wishes.data.map((w) => (
        <li key={w.id} className="card-frame p-4">
          <Link to="/wish/$id" params={{ id: w.id }} className="text-sm font-semibold underline">{w.title}</Link>
          <p className="mt-1 text-[11px] text-mute">{w.creator_display_name} · {STATUS_LABELS[w.status] ?? w.status} · {naira(w.amount_raised)} of {naira(w.goal_amount)} · {timeAgo(w.created_at)}</p>
          <div className="mt-2 flex flex-wrap gap-2"><ModActions kind="wish" id={w.id} /></div>
        </li>
      ))}
    </ul>
  );
}

function Giveaways() {
  const items = useQuery({
    queryKey: ["admin", "giveaways"],
    queryFn: async () => {
      const { data, error } = await supabase.from("giveaways").select("id,title,status,giver_display_name,entry_count,created_at").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
  if (!items.data?.length) return <p className="text-sm text-mute">{items.isPending ? "Loading..." : "No giveaways yet."}</p>;
  return (
    <ul className="space-y-3">
      {items.data.map((g) => (
        <li key={g.id} className="card-frame p-4">
          <Link to="/giveaways/$id" params={{ id: g.id }} className="text-sm font-semibold underline">{g.title}</Link>
          <p className="mt-1 text-[11px] text-mute">{g.giver_display_name} · {g.status.replace(/_/g, " ")} · {g.entry_count} entries · {timeAgo(g.created_at)}</p>
          <div className="mt-2 flex flex-wrap gap-2"><ModActions kind="giveaway" id={g.id} /></div>
        </li>
      ))}
    </ul>
  );
}

function Users() {
  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_recent_users", { _limit: 100 });
      if (error) throw error;
      return data ?? [];
    },
  });
  if (!users.data?.length) return <p className="text-sm text-mute">{users.isPending ? "Loading..." : "No members yet."}</p>;
  return (
    <div>
      <p className="mb-3 text-sm text-mute">Roles are managed in the Team tab.</p>
      <ul className="divide-y-2 divide-ink card-frame">
        {users.data.map((u) => (
          <li key={u.id} className="p-4">
            <p className="truncate text-sm font-semibold">{u.display_name ?? "Unnamed"}{u.username ? <span className="ml-2 font-normal text-primary">@{u.username}</span> : null}</p>
            <p className="truncate text-xs text-mute">{u.email}{u.location ? ` · ${u.location}` : ""}</p>
            <p className="text-[11px] text-mute">Joined {timeAgo(u.created_at)}{u.last_sign_in_at ? ` · Last sign-in ${timeAgo(u.last_sign_in_at)}` : ""}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

const MOD_CAP = 5;

function Team() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"moderator" | "admin">("moderator");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const team = useQuery({
    queryKey: ["admin", "team"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_team");
      if (error) throw error;
      return data ?? [];
    },
  });
  const mods = (team.data ?? []).filter((m) => m.role === "moderator");
  const admins = (team.data ?? []).filter((m) => m.role === "admin");

  async function add(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (role === "moderator" && mods.length >= MOD_CAP) { setMsg(`The moderator team is full (maximum ${MOD_CAP}).`); return; }
    setBusy(true);
    const { data: id, error } = await supabase.rpc("admin_find_user", { _email: email });
    if (error || !id) { setBusy(false); setMsg(error?.message ?? "No member with that email."); return; }
    const res = await supabase.rpc("admin_set_role", { _user_id: id, _role: role, _grant: true });
    setBusy(false);
    setMsg(res.error ? res.error.message : `${role === "admin" ? "Admin" : "Moderator"} added.`);
    if (!res.error) setEmail("");
    await qc.invalidateQueries({ queryKey: ["admin", "team"] });
  }
  async function remove(userId: string, r: "admin" | "moderator") {
    if (!window.confirm(`Remove ${r} access for this member?`)) return;
    const { error } = await supabase.rpc("admin_set_role", { _user_id: userId, _role: r, _grant: false });
    setMsg(error ? error.message : "Access removed.");
    await qc.invalidateQueries({ queryKey: ["admin", "team"] });
  }
  const row = (m: (typeof mods)[number]) => (
    <li key={m.user_id + m.role} className="flex flex-wrap items-center justify-between gap-2 p-4">
      <div className="min-w-0"><p className="truncate text-sm font-semibold">{m.display_name ?? "Unnamed"}{m.username ? <span className="ml-2 font-normal text-primary">@{m.username}</span> : null}</p><p className="truncate text-xs text-mute">{m.email}</p></div>
      <button onClick={() => void remove(m.user_id, m.role as "admin" | "moderator")} className={`${small} border-2 border-ink bg-card`}>Remove</button>
    </li>
  );
  return (
    <div className="space-y-6">
      <div className="card-frame p-4 text-sm text-mute">
        <p className="font-semibold text-ink">Moderators</p>
        <p className="mt-1">Moderators can only view and resolve content reports and hide, approve or remove reported wishes and giveaways. They cannot see payments, bank details, the member list, or manage roles. Up to {MOD_CAP} moderators.</p>
      </div>
      <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Member email" className="min-w-0 flex-1 rounded-lg border-2 border-ink bg-card px-3 py-2 text-sm" />
        <select value={role} onChange={(e) => setRole(e.target.value as "moderator" | "admin")} className="rounded-lg border-2 border-ink bg-card px-3 py-2 text-sm"><option value="moderator">Moderator</option><option value="admin">Admin</option></select>
        <button disabled={busy} className="press rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">Add to team</button>
      </form>
      {msg ? <p className="text-sm font-semibold">{msg}</p> : null}
      <section><h3 className="font-display text-lg">Moderators ({mods.length}/{MOD_CAP})</h3>{mods.length ? <ul className="mt-2 divide-y-2 divide-ink card-frame">{mods.map(row)}</ul> : <p className="mt-2 text-sm text-mute">{team.isPending ? "Loading..." : "No moderators yet. We suggest 3 to 5."}</p>}</section>
      <section><h3 className="font-display text-lg">Admins</h3>{admins.length ? <ul className="mt-2 divide-y-2 divide-ink card-frame">{admins.map(row)}</ul> : null}</section>
    </div>
  );
}
