PHASE 01BI — Activity Date Filter Smooth Motion

Updated files:
- components/ProfileView.tsx
- app/globals.css

Scope:
- Smooth Apple-like motion for Activity management/date-filter state changes.
- Date Filter popup/subview reveal is softened without scale animation.
- Day/Month/Year calendar stage transitions are softened.
- Selected date preview animates in smoothly.
- Filtered/unfiltered Activity results animate in after fresh data is received.
- Activity management status bar animates in instead of appearing as a hard cut.
- Fast behavior is preserved; no artificial delay is added.
- prefers-reduced-motion is respected.

No API, Prisma, database, delete logic, filter logic, or selection logic changes.
