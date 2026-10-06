# Wishr profiles, quick giving, and visual refresh

## Goal
Deliver the requested updates in order: establish the initial administrator and support contact, add searchable member profiles, add homepage quick giving, then refresh the visual canvas without changing Wishr’s core flows.

## 1. Admin access and support
- Grant the existing `idowudaviddamilola@gmail.com` account the administrator role.
- Replace temporary contact copy with a clickable support email on the Contact page and footer.
- Check other help and safety copy for outdated contact placeholders.

## 2. Usernames, search, and profiles
- Add unique, case-insensitive usernames to member profiles, with safe validation and generated usernames for existing and future accounts.
- Add database functions that expose only public profile fields, never email, phone, roles, or private payment details.
- Add a compact member search in the header and Explore page for `@username` or display name.
- Add `/u/:username` with avatar, display name, username, active wishes, granted wishes, hosted giveaways, and a copy/share link.
- Let members edit their username from their own profile.

## 3. Active Wishers quick giving
- Add a homepage Active Wishers section sourced from recently updated active wishes.
- Each card links to the member profile and opens a quick-giving modal using the existing secure bank-detail lookup and pending-payment reporting flow.
- Include ₦1,000, ₦2,500, ₦5,000, ₦10,000 presets, custom amount, transfer details, copy controls, and a link to the full wish.

## 4. Visual refresh
- Move the site canvas to white with restrained mint/teal ambient depth and subtle texture.
- Use Plus Jakarta Sans for headings and Inter for body text.
- Keep the official Wishr logo, semantic brand colors, accessible contrast, and recognizable tactile card/button interactions.
- Improve spacing and soften the overall green wash without changing routes or workflows.

## Validation
- Verify database permissions and admin access.
- Run the relevant checks and confirm the app builds.
- Test search, public profiles, quick giving, and key homepage layouts on desktop and mobile.
