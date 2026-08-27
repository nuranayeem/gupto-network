GUPTO NETWORK — PHASE 01AX
Activity Selection Action Bar Polish

Updated files:
- components/ProfileView.tsx
- app/globals.css

Changes:
- Larger selected-count text; becomes Gupto purple when one or more activities are selected.
- "Select all shown" renamed to "Select all".
- Select all is now a true toggle: click once to select all currently shown activities, click again to unselect them.
- Select all uses the same circle/check visual language as activity selectors.
- Delete selected now includes the existing Font Awesome Trash Can icon.
- Cancel remains text-only and turns red on hover/focus.
- Removed pill/button visuals (borders/backgrounds/rounded pill treatment) from the selection action bar.

Preserved:
- Existing individual activity selection logic.
- Activity rows and selected-row highlight.
- Delete confirmation/API behavior.
- Activity filters, management menu, comments/reactions/replies functionality.

Validation:
- TSX syntax diagnostics: 0
- PostCSS parse: OK
- CSS braces balanced: 1757 / 1757
- Full Next.js build not run in the support-copy sandbox.
