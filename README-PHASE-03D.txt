GUPTO PHASE 03D — SMART STORY CAPTION STUDIO

Base: Phase 03C (including the approved single-blur story behaviour)

What changed
- Long captions now wrap safely, including text without spaces.
- Caption size automatically balances as the text grows.
- Added Modern, Classic, Playful and Mono fonts.
- Added Small, Medium and Large sizes.
- Added Bold, Italic and Left/Center/Right alignment.
- Added text colours.
- Added None, Glass, Solid and Highlight backgrounds with fill colours.
- Caption styling is saved in the database and restored in the story viewer.

Install
1. Extract this ZIP into the gupto-network project root and replace files.
2. Run: npx prisma migrate dev
3. Run: npx prisma generate
4. Run: npm run build
5. Run: npm run dev

No existing story is lost. Existing captions receive safe defaults.
