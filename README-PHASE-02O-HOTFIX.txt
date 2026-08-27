GUPTO PHASE 02O — STORY STUDIO HOTFIX

Fixes:
1. ProfileView TypeScript build error: selectedYear was undefined in the first AppleBirthDatePicker.
2. Story Studio desktop UI: Phase 02N styles were accidentally scoped inside the max-width: 720px media query.

Install:
Extract this ZIP into the gupto-network project root and replace matching files.

Then run:
npx prisma generate
npm run build
npm run dev

No database migration is required for this hotfix.
