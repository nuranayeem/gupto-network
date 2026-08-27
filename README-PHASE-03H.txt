GUPTO PHASE 03H — CUSTOM STORY CAPTION SIZE

WHAT CHANGED
- Added a precise 8px–72px caption size slider.
- Added a numeric px input for exact sizing.
- Small, Medium and Large remain available as quick presets.
- The selected size is stored in the database and reproduced in the published story viewer.
- The chosen custom value overrides automatic caption shrinking.

INSTALL
1. Extract this ZIP into the project root and allow matching files to be replaced.
2. Run: npx prisma migrate dev
3. Run: npx prisma generate
4. Run: npm run build
5. Run: npm run dev

ROLLBACK
Use GUPTO-PHASE-03H-ROLLBACK-TO-03G.zip and follow its README.
