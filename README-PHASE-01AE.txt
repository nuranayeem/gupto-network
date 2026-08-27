GUPTO NETWORK — PHASE 01AE
Activity Edit Comment layout repair
Date: 2026-08-20

Purpose
- Restore the pre-01AD visual position/style of the Activity Edit Comment box.
- Increase only its usable width so it reaches the activity source/arrow lane.
- Keep textarea height at 108px.
- Keep textarea font regular (400).
- Preserve normal Activity comment layout and all comment actions/API behavior.

Root cause repaired
- An older high-specificity rule `.profile-activity-copy > div { display:flex; ... }`
  was overriding the intended comment-detail layout during edit mode.
- This caused the full-width editor to become a horizontal flex sibling and move right.

Changed files
- components/ProfileView.tsx
- app/globals.css

No Prisma/schema/migration/API changes.
