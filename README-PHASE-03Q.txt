GUPTO PHASE 03Q — 20-SECOND STORY MUSIC TRIMMER

Install over Phase 03P:
1. Extract this ZIP into the project root and replace matching files.
2. Run: npx prisma migrate dev
3. Run: npx prisma generate
4. Run: npm run build
5. Run: npm run dev

What changed:
- A separate Add music option appears after visual media is selected.
- Full songs can be uploaded, then any 20-second segment can be selected.
- Without trimming, the first 20 seconds are used automatically.
- Tracks shorter than 20 seconds use their complete duration.
- The same segment and duration are preserved in published Stories.
