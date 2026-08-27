GUPTO Phase 04L — Border-matched integrated plus

- Install this update over Phase 04K.
- The plus now shares the frame's exact horizontal and vertical axes.
- Plus and frame use the same white tone, 2px weight and rounded line endings.
- The clean micro-gaps remain, while the whole mark reads as one continuous
  frame component instead of a separate icon.
- No database migration is required.

After replacing the files, run:
  npm run build
  npm run dev

Then hard-refresh the browser (Ctrl+Shift+R).
