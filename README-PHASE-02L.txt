GUPTO NETWORK — PHASE 02L
FIXED YOUR STORY + FULL PROFILE SNAP

Updated files:
- components/Stories.tsx
- app/globals.css

Changes:
1. The signed-in user's “Your story” profile is now permanently fixed at the
   left side of the Stories block, matching the fixed behavior of category All.
2. Other story profiles scroll inside their own track.
3. Desktop shows seven complete story profiles in the scrollable area; mobile
   shows four complete profiles.
4. Mouse-wheel movement advances by one complete profile and CSS scroll snap
   prevents a partially clipped profile from remaining at either edge.
5. Page/post scrolling remains blocked while the pointer is over Stories.

Validation:
- Source structure and CSS selectors verified.
- Production build could not be executed in this scratch handoff because the
  provided project copy does not include node_modules and package installation
  is unavailable in the restricted runtime.
