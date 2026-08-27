GUPTO PHASE 03C — LANDSCAPE ZOOM-OUT SINGLE BACKDROP FIX

Install on top of Phase 03B.

Changes:
- Removes the Landscape foreground frame's extra semi-dark background layer.
- Zoomed-out Landscape media now reveals the existing single matched blur underneath.
- Eliminates the visible double-layer / extra-blur bands after publishing.
- Keeps the Phase 03B shapeless natural-media blur unchanged.
- Applies consistently to Create Story preview and published Story viewer.

File:
- app/globals.css

No database migration is required.

After copying the file, run:
npm run build
npm run dev
