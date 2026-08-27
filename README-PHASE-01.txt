GUPTO NETWORK — PHASE 01 PROFILE UI/UX PATCH
Date: 2026-08-20

SCOPE
-----
This patch updates only the Profile Page UI/UX information architecture.

UPDATED FILES
-------------
components/ProfileView.tsx
app/globals.css

WHAT CHANGED
------------
1. Profile top navigation:
   Overview | Posts | About | Media | Activity

2. Overview is now the default tab for the current user's profile.
   It uses existing saved profile/post data only:
   - bio / location / work / education summary
   - profile completion
   - post count
   - member since
   - latest post preview

3. About information is grouped into:
   - Basics
   - Places
   - Work
   - Education
   - Relationships
   - Links

4. About row icons/actions use a more consistent outline visual language.
   Edit/Delete actions are cleaner ghost/hover controls.

5. Media tab uses currently supported profile media only:
   - profile photo
   - cover photo
   No fake video/album/post-media data was added.

6. Activity is now one top-level tab with secondary filters:
   All | Reactions | Comments | Replies
   Existing /api/profile/activity endpoints are reused unchanged.

7. Profile hierarchy, spacing, typography and responsive behavior were polished.

NOT CHANGED
-----------
- Prisma schema/migrations
- authentication
- profile persistence APIs
- profile/cover upload and adjustment logic
- PostCard logic
- reactions/comments/replies logic
- Home/feed architecture

HOW TO APPLY ON WINDOWS
-----------------------
1. Keep the supplied pre-phase backup in a safe place.
2. Stop the dev server if it is running.
3. Extract this ZIP into:

   D:\Projects

   Allow Windows to merge/overwrite the two matching project files.

4. Open PowerShell:

   cd D:\Projects\gupto-network
   npm run build

5. If build succeeds, start development normally:

   npm run dev

No Prisma migrate/generate step is required for this phase because no database/schema file changed.

ROLLBACK
--------
Use the separate Phase 01 rollback ZIP and extract it into D:\Projects with overwrite.
Or restore the full pre-phase backup snapshot.
