GUPTO NETWORK — PHASE 01AS
Activity Management Popup Header Removal / Trigger Toggle Lock

Changed:
- Removed the internal Manage Activity icon/header row from the root popup.
- Removed the internal Close (×) button.
- The external Activity Management icon remains the single open/close toggle.
- First click opens the menu; clicking the same icon again closes it.
- Existing outside-click and Escape-to-close behavior remains available.
- Submenu Back controls remain because they are required to return from Type/Time/Calendar screens.

Changed file:
- components/ProfileView.tsx

Not changed:
- app/globals.css
- Activity APIs
- Prisma/database
- All/Reactions/Comments/Replies UI
- Management options and delete/filter behavior
