GUPTO NETWORK — PHASE 01BA
Activity Type Scoped Selection Mode

UPDATED FILE:
- components/ProfileView.tsx

CHANGE:
- Delete by Activity Type > Reactions/Comments/Replies now opens type-scoped selection mode instead of immediate bulk-delete confirmation.
- Choosing Reactions shows only reaction activities and enables the existing manual selection / Select all / Delete selected / Cancel workflow.
- Choosing Comments does the same for comment activities.
- Choosing Replies does the same for reply activities.
- Existing selection UI, delete-selected API, Activity cards, filters, CSS, Prisma and database schema are unchanged.

VALIDATION:
- TypeScript transpile syntax diagnostics: 0
- Full Next.js build not run in the support copy.
