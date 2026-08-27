GUPTO NETWORK — PHASE 01BT
Activity Filter Active Background Removal

Changed file:
- app/globals.css

Updates:
- Removed the soft-purple background and shadow from the active Activity filter.
- Active filter remains identifiable through Gupto-purple icon, label and count.
- Preserved the color-only hover behavior and balanced icon/text/count sizing.

Untouched:
- Activity filter/count logic and selection behavior
- Manage Activity, cards, menus and dropdowns
- Profile sections outside Activity
- API, Prisma and database

Validation:
- CSS brace balance: PASS
- Full Next.js build was not run because the handoff support copy intentionally excludes node_modules.

Apply:
Copy app/globals.css into D:\Projects\gupto-network\app\globals.css and replace the existing file.

Rollback:
Use the separate Phase 01BT rollback ZIP to return to Phase 01BS.
