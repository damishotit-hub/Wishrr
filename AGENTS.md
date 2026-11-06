<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Store wish transfer details in an owner-only table; expose them to signed-in non-owner givers only via a scoped database function, never a public wish row, to prevent bank-detail leaks.
- Treat giver transfer reports as pending until the wish owner confirms receipt; only confirmed transfers count toward funding, to avoid false fulfillment.
- Store profile photos in a private, user-folder-scoped bucket and show them with short-lived signed URLs, to limit public access.
- In-kind wish offers and their chats live in owner/giver-only tables (party check via security-definer helpers), so handoff details never appear on public rows.
- Admin-only data (user list, role changes) goes through security-definer functions that check has_role(admin) first.
- Moderators act only through the moderate_content() security-definer function (reported items only) and content_reports policies; never grant them table policies on financial or role data, so moderation stays separated from money and access control.
- Direct messages live in conversations/direct_messages with party-only RLS; conversations are created only via start_conversation() so pairs stay unique and ordered.
- Live "online now" uses one shared Realtime presence channel per tab (src/lib/community.tsx); member count comes from get_member_count() so profile rows stay private.
- Wish audio uses private user-folder-scoped storage with short-lived playback URLs; storage reads follow wish-row visibility, and duration metadata has a database check while actual files are decoded before upload to enforce the voice limit.
- Render downloadable wish stories in the browser through a dedicated canvas module using semantic theme tokens and QRCode for scannable active-origin links; no private transfer or coordination data enters exported artwork.
- Home-screen installation uses the existing manifest and official icons with matching mobile head metadata, without app-shell service workers or offline caches, to keep previews fresh.
- Keep interface colors, elevations, and typography in global semantic tokens, independent of the official logo asset, so visual sweeps never recolor the logo or change business flows.
- AppShell owns progressive scroll-reveal effects for below-fold sections using IntersectionObserver with cleanup and reduced-motion support, so route content stays visible without JavaScript.
- Signup browser hashes are captured best-effort via the auth signup trigger (email) and first authenticated session (OAuth/legacy accounts), immutable per account and readable only through an admin-checked review RPC; matching signals never gate signup and raw browser settings are not persisted.
