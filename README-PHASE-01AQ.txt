GUPTO NETWORK — PHASE 01AQ
ACTIVITY MANAGEMENT / HISTORY CONTROL

Scope
-----
Adds a compact Manage Activity icon beside the existing:
All / Reactions / Comments / Replies filters.

Added behavior
--------------
1. Select Activities
   - Select one or multiple visible activities.
   - Select all currently shown activities.
   - Delete selected activities together.

2. Delete by Activity Type
   - Reactions
   - Comments
   - Replies
   Each type is targeted independently by the management request.

3. Delete by Time Range
   - Last Hour
   - Last 7 Days / Last Week
   - Last 30 Days / Last Month
   - Last 1 Year
   - All Time

4. Calendar / Date Filter
   - Day
   - Month
   - Year
   - View matching activity.
   - Delete the selected calendar period.
   - After filtering, Select Activities can delete one/multiple shown items.

5. Delete All Activities
   - Confirmation required.

UI preservation
---------------
- Existing Activity card design preserved.
- Existing All / Reactions / Comments / Replies tabs preserved.
- Existing Reaction / Comment / Reply item menus preserved.
- Previous per-day “N activities” text removed.
- Manage Activity is now the compact advanced-action entry point.

Changed / added files
---------------------
components/ProfileView.tsx
app/globals.css
app/api/profile/activity/route.ts
app/api/profile/activity/manage/route.ts   (NEW)

Database
--------
No Prisma schema change.
No migration required.

Important behavior
------------------
Activity entries are backed by the real reaction/comment/reply records.
Bulk deletion therefore removes the underlying user activity, consistent
with the existing per-item Delete Reaction / Delete Comment / Delete Reply actions.
Deleting a comment can also remove replies nested under that comment because
PostReply belongs to PostComment with cascade behavior in the current schema.

Validation performed
--------------------
- ProfileView.tsx TypeScript/TSX syntax diagnostics: 0
- activity route TypeScript syntax diagnostics: 0
- activity manage route TypeScript syntax diagnostics: 0
- app/globals.css PostCSS parse: OK
- no Prisma schema/migration changes

Full Next.js build was NOT run in the assistant support copy because the support
archive intentionally excludes node_modules. This does not describe the user's
main local runtime installation state.

Apply
-----
Extract this ZIP into:
D:\Projects\gupto-network

Allow the listed files to replace/merge into the matching project paths.
