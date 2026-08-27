GUPTO NETWORK — PHASE 01BM
Activity Tabs Dynamic Separators

CHANGE
- Activity stream separator class is now enabled for every filter tab.
- All / Reactions / Comments / Replies now use the same automatic divider behavior.
- Future activity cards rendered through the same activity stream automatically inherit separators.

CHANGED FILE
components/ProfileView.tsx

UNTOUCHED
- Activity filter UI and active colors
- Activity Management
- Select Activities
- Date Filter
- API / Prisma / Database
- Activity edit/delete/reaction/reply logic

APPLY
Extract into the project root and replace:
components/ProfileView.tsx
