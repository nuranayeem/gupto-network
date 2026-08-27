GUPTO Phase 04K — Open-corner integrated avatar plus

- Install this update over Phase 04J.
- The purple clearance line has been removed completely.
- The white avatar frame now stops before the lower-right corner from both
  directions, creating two clean, equal gaps around the plus.
- The plus and frame use the same visual stroke, so they read as one component.
- Avatar image, size, rounded geometry and shadow remain visually consistent
  with every other Story profile.
- No database migration is required.

After replacing the files, run:
  npm run build
  npm run dev

Then hard-refresh the browser (Ctrl+Shift+R).
