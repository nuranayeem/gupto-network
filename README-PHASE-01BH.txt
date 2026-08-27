PHASE 01BH — DATE FILTER BACK CLEARS ACTIVE FILTER

Changed file:
- components/ProfileView.tsx

Behavior:
- Date Filter -> View activities -> Cancel -> Date Filter -> Back
  now clears the active date range and restores the normal Activity list.
- The "Showing <date>" status is removed after Back.
- Delete by Type / Delete by Time Back behavior is unchanged.
- Selection/delete/API/database logic is unchanged.
