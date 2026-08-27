GUPTO PHASE 03B — SHAPELESS NATURAL MEDIA BLUR

Install on top of Phase 02Z (after rolling back Phase 03A).

Changes:
- Keeps the preferred full-media matched-colour blur behavior.
- Raises blur strength from 25px to 56px.
- Expands the backdrop overscan and scale to prevent recognizable edges.
- Softens contrast while preserving the media's natural colour mood.
- Faces, text, people and object silhouettes become indistinguishable.
- Applies to photos and videos in Portrait and Landscape.
- Works in Media Lab, Create Story preview, and Story viewer.

File:
- app/globals.css

No database migration is required.

After copying the file, run:
npm run build
npm run dev
