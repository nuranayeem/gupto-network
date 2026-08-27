GUPTO PHASE 02Z — ONE MATCHED-BLUR LAYER IN EVERY CANVAS MODE

Install on top of Phase 02Y.

Changes:
- Restores matched blur for Landscape mode.
- Portrait and Landscape now both render exactly one background blur element.
- The foreground photo/video remains sharp and separate from that single blur layer.
- The behavior is consistent in Media Lab, Create Story preview, and Story viewer.
- Works for both photos and videos.

Files:
- components/StoryMediaEditor.tsx
- components/StoryStudio.tsx

No database migration is required.

After copying the files, run:
npm run build
npm run dev
