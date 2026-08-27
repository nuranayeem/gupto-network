GUPTO NETWORK — PHASE 01AT
Activity Management Menu Visual Polish

CHANGED FILES
- components/ProfileView.tsx
- app/globals.css

WHAT CHANGED
- Replaced Activity Management item glyphs with Font Awesome Free SVG icons.
- Removed icon background tiles.
- Increased menu icon and main label sizes.
- Softened icon/text contrast.
- Removed subtitles from main Activity Management actions.
- Removed extra subtitles/count copy from delete-by-type/time action rows.
- Kept chevrons only where a row actually opens a nested management view.
- Matched the successful Media action menu visual language more closely.

PRESERVED
- Manage Activity trigger/toggle behavior
- Select Activities behavior
- Delete by Activity Type logic
- Delete by Time Range logic
- Calendar/Date Filter logic
- Delete All Activities logic
- Activity cards, filters, separators, API, Prisma/database behavior

APPLY
Extract this ZIP into:
D:\Projects\gupto-network
Allow these files to replace the existing versions.

VALIDATION
- TypeScript/TSX syntax diagnostics: 0
- PostCSS parse: OK
- CSS braces balanced
- Full Next.js build was not run in the support copy because node_modules is intentionally excluded from the handoff archive.
