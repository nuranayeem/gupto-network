GUPTO NETWORK — PHASE 01BR
Activity Filter Count + Icon Polish

Changed file:
- app/globals.css

Updates:
- Removed the circular border/background from the All, Reactions, Comments and Replies count values.
- Preserved the live count numbers and all filter behavior.
- Slightly enlarged the four filter icons on desktop and mobile.

Untouched:
- Activity data/count logic
- Filter and Manage Activity behavior
- Activity cards, menus and dropdowns
- Profile sections outside Activity
- API, Prisma and database

Validation:
- CSS brace balance: PASS
- Full Next.js build was not run because the handoff support copy intentionally excludes node_modules.

Apply:
Copy app/globals.css into D:\Projects\gupto-network\app\globals.css and replace the existing file.

Rollback:
Use the separate Phase 01BR rollback ZIP to restore the previous app/globals.css.
