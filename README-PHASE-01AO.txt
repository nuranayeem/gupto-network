GUPTO NETWORK — PHASE 01AO
ACTIVITY REACTIONS → COMMENT-PARITY UI + CHANGE REACT

Changed files:
- components/ProfileView.tsx
- app/globals.css

What changed:
- Reaction activity now mirrors Comment activity structure.
- Shows source post owner's avatar, name and @username.
- Comment-text position now shows the actual reaction icon + reaction name only.
- Adds same three-dot action menu family:
  1. View Profile
  2. Change React
  3. Delete Reaction
- Change React opens an inline reaction chooser using all existing Gupto reactions.
- Delete Reaction uses confirmation modal.
- Existing post reaction API is reused; no new API/database route was added.
- Activity state and current feed post reaction/count are synchronized after change/delete.
- Existing comments, replies, separators, filters and Profile baseline are preserved.

Apply:
Extract into D:\Projects\gupto-network and replace the two listed files.

Validation performed in support copy:
- TypeScript/TSX syntax parse: 0 errors
- CSS parse: OK
- Full Next.js build not run in support copy because runtime node_modules is intentionally excluded.
