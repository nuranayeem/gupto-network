GUPTO PHASE 03A — ROLLBACK TO PHASE 02Z

Copy these files over Phase 03A to restore the previous full-media blur backdrop.
The unused components/StoryPaletteBackdrop.tsx file may be deleted after rollback.

Files restored:
- components/StoryMediaEditor.tsx
- components/StoryStudio.tsx
- app/globals.css

No database migration is required.

After copying the files, run:
npm run build
npm run dev
