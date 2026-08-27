GUPTO PHASE 03W — SHAPELESS MATCHED-COLOUR BACKGROUND

Install over Phase 03V:
1. Extract this ZIP into the project root and replace matching files.
2. Run: npx prisma migrate dev
3. Run: npx prisma generate
4. Run: npm run build
5. Run: npm run dev

What changed:
- The uploaded image is never copied into the Story background.
- Three distinct dominant colours are sampled from each uploaded image.
- A soft multi-layer colour gradient creates the matched background.
- No face, object, text or image silhouette can appear in the background.
- The gradient is smooth and moderate, without excessive blur.
- The same palette is stored for the published Story viewer.
