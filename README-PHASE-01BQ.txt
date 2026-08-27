PHASE 01BQ — Activity Short-List Dropdown Clipping Fix

Changed file:
- app/globals.css

Fix:
- Allows Activity Management and Activity item action dropdowns to render outside
  the Activity board when there are zero or only one activity item.
- Removes the content-count-dependent clipping caused by the legacy
  .profile-activity-board { overflow: hidden; } rule.

Untouched:
- Dropdown design and positioning
- Activity filters and counts
- Selection/Delete/Date Filter behavior
- Reaction/Comment/Reply action logic
- API/Prisma/database
