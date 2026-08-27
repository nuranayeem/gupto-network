GUPTO NETWORK — PHASE 01BU
About Group Header Scale + Alignment

Changed file:
- app/globals.css

Updates:
- Slightly enlarged the About group titles and icons, including Basics, Places, Work, Education, Relationships and Links.
- Matched the icon box and title line-height to a shared 22px desktop alignment grid.
- Added a compact matching 21px alignment grid for small mobile screens.
- Preserved the group subtitles, field rows and existing About behavior.

Untouched:
- About field content, edit/delete actions and persistence
- Profile sections outside About
- Activity, Home and Feed UI
- API, Prisma and database

Validation:
- CSS brace balance: PASS
- Full Next.js build was not run because the handoff support copy intentionally excludes node_modules.

Apply:
Copy app/globals.css into D:\Projects\gupto-network\app\globals.css and replace the existing file.

Rollback:
Use the separate Phase 01BU rollback ZIP to return to Phase 01BT.
