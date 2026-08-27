GUPTO NETWORK — PHASE 01AV
Activity Selection Checkbox Visual State Fix

Scope:
- Fix visible hover state for Activity selection checkbox.
- Fix visible checked box + checkmark after selecting an Activity.
- Add subtle selected-row highlight using the valid Gupto primary token.
- Preserve all selection/delete logic and Activity Management behavior.

Root cause:
The selection CSS used var(--brand), but this project defines --primary / --primary-2 and does not define --brand at the root. Therefore hover/checked paint declarations were invalid, and the white checkmark could become invisible on the white surface.

Changed file:
- app/globals.css

No API, Prisma, database, JSX, or selection logic changes.
