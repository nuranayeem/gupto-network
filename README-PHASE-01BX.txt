GUPTO NETWORK — PHASE 01BX
Database-Backed Followers / Following

Changed / added files:
- prisma/schema.prisma
- prisma/migrations/20260824103000_add_profile_follows/migration.sql
- types/current-user.ts
- app/page.tsx
- app/api/profile/route.ts
- app/api/profile/about/route.ts
- app/api/profile/[userId]/follow/route.ts (new)
- app/profile/[userId]/page.tsx
- components/ProfileView.tsx
- components/ProfileFollowButton.tsx (new)
- app/globals.css

Updates:
- Added a dedicated database Follow relation with unique follower/following pairs and self-follow protection.
- Added authenticated Follow/Unfollow behavior on another user's profile.
- Added real Followers and Following counts to own-profile statistics.
- Added Followers and Following counts to public profiles.
- Updated profile responses so counts survive profile/About edits.
- Redesigned own-profile stats as Posts / Followers / Following / Complete / Member since.
- Added responsive five-stat layout for desktop, tablet and mobile.

Preserved:
- Existing Friendship model and friend-based post visibility
- Authentication, posts, reactions, comments, replies and Activity
- Existing Profile/About/Media behavior

Required database step:
1. Stop the development server.
2. Open PowerShell in D:\Projects\gupto-network.
3. Run: npx prisma migrate dev
4. Run: npx prisma generate
5. Run: npm run build
6. Start normally with: npm run dev

Validation:
- Migration SQL structure and changed source paths inspected.
- CSS brace balance: PASS.
- Full Prisma migration/build was not run in the handoff support copy because generated and node_modules are intentionally excluded.

Rollback warning:
The rollback ZIP restores source files only. If the migration has already been applied, preserve database data and use a deliberate Prisma migration rollback workflow instead of manually deleting migration history.
