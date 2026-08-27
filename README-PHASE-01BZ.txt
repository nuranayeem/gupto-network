GUPTO NETWORK — PHASE 01BZ
Mobile Profile Stat Order

Changed file:
- app/globals.css

Mobile order:
1. Followers
2. Following
3. Posts
4. Member since

Updates:
- Followers now occupies the former Posts position.
- Following now occupies the former Followers position.
- Posts now occupies the former Following position.
- Desktop and tablet order remains Posts / Followers / Following / Member since.

Untouched:
- Stat values and Followers/Following functionality
- Profile JSX, API, Prisma schema and database
- Other Profile, Activity, Home and Feed UI

Validation:
- CSS brace balance: PASS.
- Update and rollback ZIP integrity: PASS.

Apply:
Extract into D:\Projects\gupto-network and replace app/globals.css.

Rollback:
Use the separate Phase 01BZ rollback ZIP to return to Phase 01BY.
