Gupto Network - Phase 01T
Activity Comment Context Card

Updated:
- Comment activity keeps "Commented on a post" + Comment badge.
- Shows the target post owner's avatar, name and username.
- Shows the exact submitted comment as a quote.
- Existing source/arrow row is now a real link to the exact post:
  /?post=<postId>#post-<postId>
- Activity API now exposes the already-existing post author identity fields needed by the UI.

Changed files only:
- components/ProfileView.tsx
- app/globals.css
- app/api/profile/activity/route.ts

No Prisma schema or migration changes.
