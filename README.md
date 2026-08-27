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

```mermaid
flowchart TB
    ROOT["Gupto Network"]

    ROOT --> APP["Application"]
    ROOT --> CORE["Data and Domain"]
    ROOT --> SUPPORT["Project Support"]

    APP --> APPDIR["app/ — Pages, routes, and APIs"]
    APP --> COMPONENTS["components/ — UI and features"]

    CORE --> DATA["data/ — Static application data"]
    CORE --> LIB["lib/ — Domain and utility logic"]
    CORE --> PRISMA["prisma/ — Schema and migrations"]

    SUPPORT --> PUBLIC["public/ — Static assets"]
    SUPPORT --> SCRIPTS["scripts/ — Maintenance tools"]
    SUPPORT --> TYPES["types/ — TypeScript definitions"]
    SUPPORT --> DOCS["docs/ — Design documentation"]

    classDef root fill:#6f4cff,color:#ffffff,stroke:#5a36e8,stroke-width:2px;
    classDef group fill:#eee9ff,color:#312568,stroke:#b6a7ff,stroke-width:1.5px;
    classDef folder fill:#ffffff,color:#252735,stroke:#cfd3df,stroke-width:1px;

    class ROOT root;
    class APP,CORE,SUPPORT group;
    class APPDIR,COMPONENTS,DATA,LIB,PRISMA,PUBLIC,SCRIPTS,TYPES,DOCS folder;
`

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
