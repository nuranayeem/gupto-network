GUPTO NETWORK — PHASE 02A
Home Header / Gupto Pulse

Changed files:
- components/Feed.tsx
- app/globals.css

Updates:
- Removed the old YOUR SPACE / Good evening greeting from Home.
- Added a compact clickable profile avatar on the left.
- Added a calm animated Gupto Pulse identity in the center.
- Preserved the existing Theme and Notification actions on the right.
- Added dark-mode styling and prefers-reduced-motion support.
- On mobile/tablet, the existing compact Mobile Header remains the single header and the desktop Pulse Header is hidden.

Strictly untouched:
- Stories
- Composer
- Feed filters
- PostCard and all post interactions
- Profile and Activity
- API, Prisma schema and database

Validation:
- CSS brace balance: PASS.
- Changed Home header JSX inspected.
- Update and rollback ZIP integrity: PASS.
- Full Next.js build was not run in the support copy because node_modules is intentionally excluded.

Apply:
Extract into D:\Projects\gupto-network and replace the matching files.
No migration or Prisma generation is required.

Rollback:
Use the separate Phase 02A rollback ZIP to return to the final Phase 1 / Phase 01BZ state.
