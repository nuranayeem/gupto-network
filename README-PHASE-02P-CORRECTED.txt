GUPTO PHASE 02P (CORRECTED) — PHOTO & VIDEO MEDIA LAB

Important
- This is the corrected Phase 02P built directly on Phase 02O.
- Do not install the earlier Phase 02P music-editor ZIP.

Features
- Full-screen Apple-style editor opens after choosing a photo or video.
- Portrait, Square and Landscape composition.
- Fill and Fit modes for horizontal or vertical media.
- 50%–300% zoom using slider or mouse wheel.
- Drag/touch repositioning in any direction.
- Free rotation plus quick left/right 90-degree rotation.
- Horizontal and vertical mirror.
- One-click reset.
- The exact composition is saved in the database and reproduced in the story viewer.
- Existing stories receive safe default transform values.

Install
1. Extract into the gupto-network project root and replace matching files.
2. Run:
   npx prisma migrate dev
   npx prisma generate
   npm run build
   npm run dev

This update does not contain the rejected music-trimming or Video + Music changes.
