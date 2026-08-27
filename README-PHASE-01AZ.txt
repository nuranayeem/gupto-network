GUPTO NETWORK — PHASE 01AZ
Delete by Activity Type — Dedicated Font Awesome Icon Fix

Changed:
- components/ProfileView.tsx
- app/globals.css

Fix:
- Reactions / Comments / Replies in Delete by type no longer reuse ActivityFilterIcon.
- Dedicated Font Awesome management SVGs are used instead.
- Icons have explicit size, fill and contrast, isolated from Activity filter CSS.
- Hover/focus uses Gupto primary purple.

No API, database, delete logic, selection logic, or other Activity UI behavior changed.
