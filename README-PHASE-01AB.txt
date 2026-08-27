GUPTO NETWORK — PHASE 01AB
Activity Comment Action Menu
20 August 2026

Changes:
- Added a 3-dot comment action trigger aligned with the post-author row in Profile > Activity.
- Action menu matches the existing Media action-menu visual language.
- Actions: View Profile, Edit Comment, Delete Comment.
- Edit Comment uses a focused inline editor and updates the original comment through the existing comment API.
- Activity edits intentionally do not show an "edited" marker.
- Delete Comment uses the existing delete API and removes stale reply activity from current client state.
- Added a read-only /profile/[userId] destination for viewing another post author's profile.
- Own-profile View Profile redirects back to /#profile.

No Prisma schema or migration changes.
