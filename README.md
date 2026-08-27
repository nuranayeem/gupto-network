# Gupto Network

A full-stack social networking platform built with Next.js, React, TypeScript, Prisma, and PostgreSQL.

Gupto Network combines secure authentication, persistent social content, advanced profiles, threaded conversations, and an immersive story experience in a responsive desktop and mobile interface.

## Highlights

- Email signup, OTP verification, login, and password recovery
- Persistent sessions with Auth.js
- Rich profiles with media, categories, workplaces, interests, and social links
- Public profile pages and follow relationships
- Database-backed posts, reactions, comments, replies, and conversation threads
- Photo, video, photo-with-music, and music-only stories
- Story media editing, captions, palettes, audio trimming, viewer controls, and view tracking
- Responsive desktop, tablet, and mobile layouts
- PostgreSQL persistence with versioned Prisma migrations

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, TypeScript, CSS |
| Authentication | Auth.js / NextAuth |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Validation | Zod |
| Media | Sharp |
| Runtime | Node.js |

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm
- PostgreSQL
- Git

### Installation

```bash
git clone https://github.com/nuranayeem/gupto-network.git
cd gupto-network
npm install
```

Create the local environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure `.env`, prepare the database, and start development:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Primary PostgreSQL connection |
| `SHADOW_DATABASE_URL` | Prisma shadow database connection |
| `AUTH_SECRET` | Auth.js session secret |
| `OTP_SECRET` | OTP signing secret |
| `SIGNUP_EMAIL_MODE` | Signup email delivery mode |
| `PASSWORD_RESET_EMAIL_MODE` | Password-reset email delivery mode |
| `RESEND_API_KEY` | Resend API credential |
| `EMAIL_FROM` | Transactional email sender |

Never commit a populated `.env` file or production credentials.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npx prisma migrate dev` | Apply development migrations |
| `npx prisma studio` | Inspect local database records |

## Project Structure

```text
gupto-network/
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   ├── password-reset/
│   │   │   └── signup/
│   │   ├── posts/
│   │   │   ├── [postId]/
│   │   │   └── route.ts
│   │   ├── profile/
│   │   │   ├── [userId]/
│   │   │   ├── about/
│   │   │   ├── activity/
│   │   │   ├── media/
│   │   │   └── route.ts
│   │   └── stories/
│   │       ├── [storyId]/
│   │       ├── media/
│   │       └── route.ts
│   │
│   ├── auth-error/
│   ├── forgot-password/
│   ├── login/
│   ├── profile/
│   │   └── [userId]/
│   ├── reset-password/
│   ├── signup/
│   ├── verify-email/
│   ├── verify-reset/
│   ├── auth-actions.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── auth/
│   ├── Composer.tsx
│   ├── Feed.tsx
│   ├── GuptoNetworkApp.tsx
│   ├── MobileHeader.tsx
│   ├── MobileNav.tsx
│   ├── PostCard.tsx
│   ├── ProfileFollowButton.tsx
│   ├── ProfileView.tsx
│   ├── RightPanel.tsx
│   ├── Sidebar.tsx
│   ├── Stories.tsx
│   ├── StoryMediaEditor.tsx
│   ├── StoryPaletteBackdrop.tsx
│   ├── StoryStudio.tsx
│   ├── ThemeToggle.tsx
│   └── UserAvatar.tsx
│
├── data/
│
├── docs/
│   └── DESIGN_SYSTEM.md
│
├── lib/
│   ├── prisma.ts
│   ├── story-media.ts
│   └── profile and authentication utilities
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── public/
│   ├── icons/
│   └── images/
│
├── scripts/
│
├── types/
│   ├── current-user.ts
│   └── story.ts
│
├── .env.example
├── .gitignore
├── auth.ts
├── next-env.d.ts
├── next.config.mjs
├── package.json
├── package-lock.json
├── prisma.config.ts
├── tsconfig.json
└── README.md
```

## Data and Media

Application records are persisted in PostgreSQL. Runtime uploads, generated output, dependencies, build artifacts, and local secrets are excluded from version control.

Database evolution is tracked in `prisma/migrations`.

## Documentation

The visual baseline and preserved design tokens are documented in [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).

## Project Status

Gupto Network is under active development. Its current foundation includes authentication, profiles, follows, posts, reactions, threaded discussions, stories, media handling, and responsive navigation.

## Security

Do not publish credentials or sensitive vulnerability details in a public issue. Contact the repository owner privately when reporting a security concern.

---

Built and maintained by [Nur A Nayeem](https://github.com/nuranayeem).
