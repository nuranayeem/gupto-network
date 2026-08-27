GUPTO PHASE 02Y — LANDSCAPE SINGLE-LAYER MEDIA

Install on top of Phase 02X.

Changes:
- Landscape media no longer renders the extra blurred background layer.
- The fix applies consistently in Media Lab, Create Story preview, and Story viewer.
- Portrait matched-blur behavior remains unchanged.
- Works for both photos and videos.

Files:
- components/StoryMediaEditor.tsx
- components/StoryStudio.tsx

No database migration is required.

After copying the files, run:
npm run build
npm run dev
