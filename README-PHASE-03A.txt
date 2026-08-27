GUPTO PHASE 03A — DOMINANT-COLOUR GRADIENT BACKDROP

Install on top of Phase 02Z.

Changes:
- Replaces the blurred copy of the full image/video with a colour-only backdrop.
- Samples the media and selects up to three visually distinct dominant colours.
- Builds a smooth layered radial and linear gradient from those colours.
- Faces, text, people and object silhouettes are no longer reproduced in the background.
- Uses one palette backdrop in Portrait and Landscape.
- Works in Media Lab, Create Story preview, and Story viewer.
- Supports both photos and videos, with a safe fallback palette.

Files:
- components/StoryPaletteBackdrop.tsx (new)
- components/StoryMediaEditor.tsx
- components/StoryStudio.tsx
- app/globals.css

No database migration is required.

After copying the files, run:
npm run build
npm run dev
