# GUPTO NETWORK — Next.js Migration

This is the migrated version of the original GUPTO NETWORK social homepage.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Existing CSS preserved as-is

## Visual-preservation rule

The original `styles.css` was copied directly to `app/globals.css` without changing its design tokens, typography, spacing, breakpoints, gradients, shadows, radii, or responsive rules.

The original HTML structure was decomposed into React components while keeping the same CSS class names and DOM hierarchy wherever the styling depends on it.

## Preserved interactions

- Light/dark mode with saved preference
- Responsive desktop/tablet/mobile layout
- Story strip
- Composer auto-resize and character counter
- Publish new text posts
- Like/unlike
- Bookmark/unbookmark with toast feedback
- Follow/following buttons
- Feed tab selection
- Ctrl/Cmd + K search focus
- Desktop and mobile composer shortcuts

## Project structure

```text
app/
  globals.css
  layout.tsx
  page.tsx
components/
  Brand.tsx
  Composer.tsx
  Feed.tsx
  MobileHeader.tsx
  MobileNav.tsx
  GuptoNetworkApp.tsx
  PostCard.tsx
  RightPanel.tsx
  Sidebar.tsx
  Stories.tsx
  ThemeToggle.tsx
data/
  posts.ts
types/
  social.ts
```

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Next.js.

For a production check:

```bash
npm run build
npm start
```

## Migration note

No backend, database, authentication, upload storage, or real social API has been added in this phase. This phase is intentionally limited to framework migration while preserving the existing UI and front-end behavior.
