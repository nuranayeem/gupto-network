# GUPTO NETWORK

> A modern social networking platform focused on persistent user profiles, posts, identity, personal interests, workplaces, and social presence — built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Description

**GUPTO NETWORK** is a full-stack social media platform designed as a real, evolving product rather than a static UI prototype.

The project includes authentication, persistent posts, advanced user profiles, profile and cover media, structured About information, editable personal details, multiple workplaces, interests, social links, category-based identity, and a responsive desktop/mobile interface.

The current codebase is built around a **Next.js App Router** architecture with server-side route handlers, **Prisma ORM**, and a **PostgreSQL** database.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Routing:** Next.js App Router
- **Backend:** Next.js Route Handlers / Server-side application logic
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** Signup, login, OTP verification, and password recovery flow
- **Styling:** Custom responsive CSS
- **Media:** Local profile and cover media handling during development
- **Development:** npm, Prisma CLI, Git, GitHub

## Setup Instructions

### Prerequisites

- Node.js 20.9+
- npm
- Git
- A configured PostgreSQL / Prisma development database

### 1. Clone the repository

```bash
git clone https://github.com/nuranayeem/gupto-network.git
cd gupto-network
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the environment file

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Then fill in the required values inside `.env`.

> Never commit your real `.env` file to GitHub.

### 4. Start the local Prisma database

```bash
npx prisma dev start gupto-network
```

Keep the database process running while developing locally.

### 5. Apply database migrations

```bash
npx prisma migrate dev
```

### 6. Generate Prisma Client

```bash
npx prisma generate
```

### 7. Start the application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Features

### Authentication

- [x] User signup
- [x] User login
- [x] OTP verification flow
- [x] Password recovery flow
- [x] Authenticated user session handling

### Posts

- [x] Persistent posts
- [x] Database-backed post storage
- [x] Feed integration
- [x] Profile post integration

### Profile

- [x] Name
- [x] Username
- [x] Bio
- [x] Profile photo
- [x] Cover photo
- [x] Category
- [x] Birth date
- [x] Current location
- [x] Hometown
- [x] School
- [x] College
- [x] University
- [x] Relationship status
- [x] Gender
- [x] Email
- [x] Phone number
- [x] Website
- [x] Multiple interests
- [x] Multiple social links
- [x] Multiple workplaces

### About Section

The profile About section currently supports the following structured information:

1. Bio
2. Gender
3. Category
4. Workplace
5. Current location
6. Hometown
7. School
8. College
9. University
10. Relationship status
11. Interests
12. Social links
13. Website
14. Birth date
15. Email
16. Phone number

Additional behavior:

- [x] Edit individual About fields
- [x] Delete individual About fields
- [x] Database-backed updates
- [x] Database-backed deletes
- [x] Private labels for sensitive profile information
- [x] Clickable website links
- [x] Platform/domain favicon support for social links
- [x] Organization favicon/logo support for workplace links
- [x] Workplace name only
- [x] Workplace link only
- [x] Workplace name + link

### Profile Categories

- [x] Multiple user categories
- [x] Category-specific icons
- [x] Public Figure identity badge
- [x] Custom Beauty category icon
- [x] Custom Fashion category icon

### Responsive Interface

- [x] Desktop layout
- [x] Mobile navigation
- [x] Mobile header
- [x] Responsive profile interface
- [x] Responsive feed components
- [x] Sidebar navigation
- [x] Stories UI
- [x] Composer UI
- [x] Post card UI

## API Structure

The project includes application routes for persistent posts, profiles, About information, and profile media.

| Area | Route / Location | Purpose |
|---|---|---|
| Posts | `app/api/posts/` | Persistent post operations |
| Profile | `app/api/profile/` | Main profile operations |
| About | `app/api/profile/about/` | About field update/delete logic |
| Profile media | `app/api/profile/media/` | Profile and cover media handling |
| Media files | `app/api/profile/media/file/[userId]/[filename]/` | User media file delivery |

## Database

The application uses **Prisma ORM with PostgreSQL**.

Database schema:

```text
prisma/schema.prisma
```

Migration history:

```text
prisma/migrations/
```

Important commands:

```bash
npx prisma migrate dev
npx prisma generate
```

> Do not use `prisma migrate reset` on a database containing data you want to keep.

## Project Structure

```text
gupto-network/
├── app/
│   ├── api/
│   │   ├── posts/
│   │   └── profile/
│   ├── globals.css
│   └── page.tsx
│
├── components/
│   ├── Composer.tsx
│   ├── Feed.tsx
│   ├── GuptoNetworkApp.tsx
│   ├── MobileHeader.tsx
│   ├── MobileNav.tsx
│   ├── PostCard.tsx
│   ├── ProfileView.tsx
│   ├── Sidebar.tsx
│   ├── Stories.tsx
│   └── UserAvatar.tsx
│
├── lib/
│   ├── prisma.ts
│   ├── profile-categories.ts
│   ├── profile-genders.ts
│   ├── profile-interests.ts
│   ├── profile-media.ts
│   ├── profile-social-links.ts
│   ├── profile-workplaces.ts
│   └── relationship-status.ts
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── public/
│   └── images/
│       └── category-icons/
│
├── scripts/
├── types/
│
├── .env.example
├── .gitignore
├── auth.ts
├── next-env.d.ts
├── next.config.mjs
├── package.json
├── package-lock.json
├── prisma.config.ts
├── README.md
└── tsconfig.json
```

## Privacy & Repository Safety

The repository is configured so that local/private runtime data is not committed.

The following are intentionally excluded from GitHub:

```text
.env
node_modules/
.next/
generated/prisma/
public/uploads/
```

This keeps environment secrets, generated dependencies, build output, generated Prisma files, and locally uploaded user media outside the repository.

## Development Notes

When starting development after cloning the project on a new device:

1. Install dependencies.
2. Create and configure `.env`.
3. Start/configure the database.
4. Apply Prisma migrations.
5. Generate Prisma Client.
6. Run the development server.

The Git repository stores the application source code and migration history, while private environment values and local uploaded media must be backed up separately when needed.

## Current Project Status

GUPTO NETWORK is under active development.

The current implementation establishes the core foundation for:

- Authentication
- Persistent social posts
- User identity
- Advanced profiles
- Structured About information
- Personal interests
- Social presence
- Multiple workplaces
- Profile media
- Responsive social-network UI
- Persistent database-backed profile management

## Repository

```text
https://github.com/nuranayeem/gupto-network
```

---

**GUPTO NETWORK** — Your space, your story.
