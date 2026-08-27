GUPTO PHASE 03R — DUAL-HANDLE MUSIC TRIM

Install over Phase 03Q:
1. Extract this ZIP into the project root and replace matching files.
2. Run: npm run build
3. Run: npm run dev

What changed:
- Music trim now has separate Start and End handles.
- Users can choose an exact segment from anywhere in the song.
- The selected segment may be shorter than 20 seconds but never longer.
- Start, End and clip Length are shown clearly.
- If untouched, the first 20 seconds remain selected by default.
- No new database migration is required after Phase 03Q.
