GUPTO NETWORK — PHASE 02N
DATABASE-BACKED STORY STUDIO

WHAT IS INCLUDED
- Real PostgreSQL-backed stories with 6/12/24/48-hour expiry.
- Photo, video, music-only and photo+music stories.
- Apple-inspired one-screen composer with live preview and child-simple steps.
- Public, Followers and Only me audience controls.
- 5/7/12/20-second viewing pace, color mood and replies preference.
- Full-screen viewer with progress, next/previous, sound, views and owner delete.
- Current user's active story remains beside the profile and can be opened from
  the Home story tile or the Profile avatar ring.
- Unseen state, per-user grouping and one-time view tracking.
- Range-enabled private media serving for smooth video/audio playback.

NEW FILES
- components/StoryStudio.tsx
- types/story.ts
- lib/story-media.ts
- app/api/stories/route.ts
- app/api/stories/[storyId]/route.ts
- app/api/stories/[storyId]/view/route.ts
- app/api/stories/media/file/[userId]/[filename]/route.ts
- prisma/migrations/20260824190000_add_full_story_system/migration.sql

UPDATED FILES
- prisma/schema.prisma
- next.config.mjs
- components/Stories.tsx
- components/Feed.tsx
- components/GuptoNetworkApp.tsx
- components/ProfileView.tsx
- app/globals.css

INSTALL / RUN (PROJECT ROOT)
1. Stop the dev server.
2. Extract this ZIP into the project root and allow file replacement.
3. Run:
     npx prisma migrate dev
     npx prisma generate
     npm run build
     npm run dev

MEDIA LIMITS
- Photo: 25 MB
- Video: 150 MB
- Music: 40 MB

IMPORTANT
- The included migration must be applied before opening the Home page.
- Existing posts, profiles, follows and earlier UI are not deleted or reset.
- Runtime story files are stored under public/uploads/story-media.

VALIDATION
- ZIP structure and migration/source wiring verified.
- A production build could not be run in this scratch handoff because the
  supplied project copy does not include node_modules.
