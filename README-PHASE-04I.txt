GUPTO Phase 04I — Owner avatar visual parity + integrated plus

- Install this update over Phase 04H.
- The owner avatar now uses the exact same 34x34 frame size, rounded design,
  white border and shadow as every other Story avatar.
- Only the status affordance differs: an integrated plus sits at the
  avatar's lower-right corner for adding a Story.
- The real current-user image remains visible.
- No database migration is required.

After replacing the files, run:
  npm run build
  npm run dev

Then hard-refresh the browser (Ctrl+Shift+R).
