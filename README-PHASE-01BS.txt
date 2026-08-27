GUPTO NETWORK — PHASE 01BS
Activity Filter Hover + Type Scale Polish

Changed file:
- app/globals.css

Updates:
- Removed background fill from the hover/focus state of inactive Activity filters.
- Hover/focus feedback now uses Gupto purple on the icon, label and count only.
- Preserved the soft-purple background for the currently active filter.
- Increased filter label and count typography to match the enlarged icons.
- Kept a balanced compact type scale on small mobile screens.

Untouched:
- Activity filter/count logic
- Active filter behavior
- Manage Activity, cards, menus and dropdowns
- Profile sections outside Activity
- API, Prisma and database

Validation:
- CSS brace balance: PASS
- Full Next.js build was not run because the handoff support copy intentionally excludes node_modules.

Apply:
Copy app/globals.css into D:\Projects\gupto-network\app\globals.css and replace the existing file.

Rollback:
Use the separate Phase 01BS rollback ZIP to return to Phase 01BR.
