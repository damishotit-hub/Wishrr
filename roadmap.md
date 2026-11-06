# Roadmap

- [x] Add live header notification center, exact unread badge, mark-all-read, and wish/chat/giveaway links; four destination tests pass.
- [x] Complete missing delivery/funding alerts; owner-only policy, grants and Realtime verified. Signed-in bell, mark-all-read, wish/chat navigation, cross-tab live updates, and 320/390px layouts verified using temporary alerts, then removed.

- [x] Replace story-card URL text with a clean QR label; browser-generated PNG verified with no UUID text, active-origin QR retained, and mobile preview checked.
- [x] Complete manifest-only iOS/Android home-screen support; manifest, mobile head tags, official icons, and absence of service workers verified. Physical-device installation remains unverified.

- [x] Record lightweight browser fingerprints at registration and show shared-device accounts to admins only; four tests passed, signup request and failure fallback checked, authenticated capture persisted, admin mobile review and private access verified.
- [ ] Verify two real registrations appear together in admin review (not exercised: no duplicate test accounts created; signup requests were intercepted).

- [x] Sweep typography to Plus Jakarta Sans throughout, replace interface green/lemon with graphite/white and restrained cool accents, preserve logo, and polish action/nav/scroll motion; verified public navigation, auth page, 320/390px layouts, reduced motion, and clean runtime/build checks.

- [x] Replace mobile navigation with a detached capsule, redesign story cards, and polish shared UI; verified 320/390px navigation, desktop layout, standalone PNG export, and clean runtime/build checks.
- [ ] Verify redesigned sharing on a real signed-in wish (blocked: preview session minting could not match the requester; requires a signed-in preview).

- [x] Add optional 60-second wish recording/upload, private storage, and card/detail playback; verified recording, upload rejection, saved playback, and phone-sized cards with a temporary private draft.

- [x] Apply the approved Wishr color palette without changing neo-brutalist styling.
- [x] Add the official Wishr logo to the main header and footer.
- [x] Derive and install the official favicon and app icon.
- [x] Verify the refreshed brand across mobile and desktop public pages.
- [x] Add private wish bank details, transfer reporting, owner confirmation and notifications.
- [x] Gate wish browsing for signed-out visitors.
- [x] Add profile name and photo editing.
- [x] Auto-save wish text drafts and mark the photo optional. Bank details and image files are not stored in localStorage.
- [x] Add the admin page and role assignment.
- [x] Grant the first admin account; authenticated admin access verified.
- [x] Add wish/giveaway reporting, in-kind offers with private chat, expanded footer and info pages.
- [x] Add giveaway details, entries, recipient flows, and giver dashboard.
- [ ] Add share images and dynamic wish social metadata.
- [x] Batch: live member/online count, Team management with capped moderators, location field, username claim onboarding + bold search, 1-on-1 messaging
