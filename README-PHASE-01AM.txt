GUPTO NETWORK — PHASE 01AM
FULL ACTIVITY UI / UX POLISH

GOAL
- Upgrade the complete Profile > Activity visual system into a calmer, cleaner,
  more premium and information-first interface.
- Preserve all existing working Activity behavior.

CHANGED FILE
- app/globals.css

DESIGN UPDATES
- Refined Activity board surface, border, radius and restrained depth.
- Converted filter controls into one compact segmented control surface.
- Improved active/hover/focus states without adding clutter.
- Refined Today/Yesterday group labels and activity counts.
- Strengthened visual timeline hierarchy with subtle rail and soft kind markers.
- Kept real reaction artwork/colors and gave reaction/comment/reply markers
  a restrained contextual surface.
- Improved title, badge, timestamp, content and context hierarchy.
- Refined source-post navigation and arrow feedback.
- Refined comment author/avatar presentation while preserving the accepted
  8px username-to-comment spacing and 13px comment text direction.
- Preserved Phase 01AL dynamic separators across all activities/day groups.
- Added matching dark-mode and mobile/tablet polish.

PRESERVED / UNTOUCHED
- components/ProfileView.tsx
- Activity API/data loading
- Prisma/database
- Filter logic and counts
- Reaction correctness/artwork
- Comment Edit/Delete/View Profile actions
- Comment editor width/height/Save/Cancel behavior
- Permanent three-dot positioning
- Exact source-post navigation
- Reply/comment/reaction data presentation
- Other Profile tabs
- Home/Feed/Stories/Composer/PostCard

APPLY
Extract this ZIP into:
D:\Projects\gupto-network
Allow app\globals.css to be replaced.

VALIDATION
- CSS brace balance: PASS
- tinycss2 top-level stylesheet parse: PASS (0 errors)
- Full Next.js build was not run in the support sandbox because the support copy
  intentionally excludes runtime node_modules.
