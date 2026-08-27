GUPTO NETWORK — PHASE 01AP
Activity Replies → Comment-Parity UI + Actions

Updated file:
- components/ProfileView.tsx

What changed:
- Reply activity now uses the same identity/detail pattern as Comment/Reaction activity.
- Shows source post owner avatar, name, @username and the actual reply text.
- Adds the same anchored 3-dot action menu family.
- Actions: View Profile / Edit Reply / Delete Reply.
- Edit Reply reuses the existing reply PATCH API and the existing Activity editor UI.
- Delete Reply reuses the existing reply DELETE API and removes the Activity item immediately.
- Reply activity refreshes after delete so Prisma-cascaded child replies do not remain stale.
- Old COMMENT / POST context boxes are hidden for Reply activity to match the Comment/Reaction card structure.
- Existing source-post navigation remains unchanged.

Not changed:
- app/globals.css
- Prisma schema/migrations
- database structure
- comment activity
- reaction activity
- feed/post/reply backend logic
- Profile tabs/layout outside Activity
