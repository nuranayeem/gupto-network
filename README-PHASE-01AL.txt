GUPTO NETWORK — PHASE 01AL
Activity cross-day separator

Scope:
- app/globals.css only

Update:
- Existing All-activity separator already separates consecutive items within the same day.
- Added the same separator under the last activity of a day when another day group follows.
- This makes Comment -> Reaction visually separated even when Reaction is under Yesterday.

Untouched:
- ProfileView.tsx
- Activity data/API logic
- Database/Prisma
- Comments/replies/reactions behavior
- Other Profile/Home UI

Apply:
Extract this ZIP into D:\Projects\gupto-network and allow app/globals.css to be replaced.
