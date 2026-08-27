GUPTO NETWORK — PHASE 01BV
Activity Title Badge Logic Removal

Changed file:
- components/ProfileView.tsx

Updates:
- Removed the type/reaction badge rendered beside activity titles.
- Commented on a post no longer shows the Comment badge.
- Reacted on a post no longer shows Like/Love/Care/Haha/Wow/Sad/Angry/Sandal badges beside the title.
- Reply activity no longer shows the Reply badge beside the title.
- Preserved the real reaction icon and reaction name inside the activity detail row.

Untouched:
- Activity data, filters, counts and management
- Reaction/comment/reply edit and delete behavior
- Activity menus, exact-post navigation and timeline separators
- About, Media, Profile, Home and Feed UI
- API, Prisma and database

Validation:
- Target JSX render block inspected after the change.
- Full Next.js build was not run because the handoff support copy intentionally excludes node_modules.

Apply:
Copy components/ProfileView.tsx into D:\Projects\gupto-network\components\ProfileView.tsx and replace the existing file.

Rollback:
Use the separate Phase 01BV rollback ZIP to return to Phase 01BU.
