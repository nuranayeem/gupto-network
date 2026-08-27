GUPTO PHASE 03G — ORIGINAL POPPINS + CAPTION TRANSFORM
======================================================

Included updates
- Poppins now uses the original Google Poppins rendering without custom spacing or text transforms.
- Caption position presets: Top, Bottom, Left, Center and Right.
- Custom mode: drag the caption directly inside the story preview.
- Caption rotation from -180° to +180°, with one-click reset.
- Safe-edge logic keeps dragged captions inside the story canvas.
- Caption position and rotation are stored in PostgreSQL and reproduced in the published story viewer.

Install
1. Close the development server.
2. Copy the folders in this ZIP into the gupto-network project root and replace matching files.
3. Run: npx prisma migrate dev
4. Run: npx prisma generate
5. Run: npm run build
6. Run: npm run dev

Quick test
- Create a story and write a caption.
- Select Poppins and compare its natural glyph spacing.
- Try all position presets.
- Drag the caption to a custom location and rotate it.
- Publish and reopen the story; placement and rotation should be unchanged.

Note
- The included migration is additive and preserves existing stories.
