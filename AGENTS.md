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
