GUPTO Phase 04M — Profile avatar plus badge bug fix

- Install this update over Phase 04L.
- Removes the old purple rounded-square badge from the large Profile avatar.
- The add-story plus is now a clean, border-matched mark attached directly to
  the avatar's lower-right frame.
- Active-story status keeps its existing compact Story label.
- Homepage Story avatar styling is untouched.
- No database migration is required.

After replacing the files, run:
  npm run build
  npm run dev

Then hard-refresh the browser (Ctrl+Shift+R).
