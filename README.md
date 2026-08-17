# GUPTO NETWORK

A modern full-stack social networking platform built with Next.js, React, TypeScript, Prisma, and PostgreSQL.

GUPTO NETWORK is being developed as a real social platform with persistent user accounts, database-backed posts, advanced user profiles, structured About information, responsive navigation, and personalized profile identities.

---

## Overview

GUPTO NETWORK provides a clean and responsive social experience where users can create accounts, manage detailed profiles, publish persistent posts, and organize personal information in a structured About section.

The application uses a full-stack Next.js architecture with Prisma ORM and PostgreSQL for persistent data storage.

---

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- CSS
- Responsive desktop and mobile interface

### Backend

- Next.js App Router
- Route Handlers / API routes
- Server-side application logic
- Authentication and profile APIs

### Database

- PostgreSQL
- Prisma ORM
- Prisma migrations

### Development

- Node.js
- npm
- Git
- GitHub
- VS Code

---

## Features

| Area | Highlights |
|------|------------|
| **Authentication** | Signup, login, OTP verification, password recovery and persistent user sessions |
| **Social Feed** | Persistent posts, database-backed storage, feed and profile integration |
| **Advanced Profiles** | Personal information, profile & cover photos, categories, education, location and contact details |
| **About System** | Individually editable and removable profile information with database persistence |
| **Social & Workplace** | Multiple social links and workplaces with automatic platform / organization icon support |
| **Personalization** | Multiple interests, profile categories, custom category icons and Public Figure identity badge |
| **Responsive Experience** | Desktop, tablet and mobile optimized interface with dedicated mobile navigation |
| **Data Persistence** | PostgreSQL + Prisma powered persistent profile and post data |

---

## Authentication

The current authentication system includes:

- User signup
- User login
- OTP verification flow
- Password recovery flow
- Authenticated user session handling

Authentication-related application logic is integrated with the main application rather than being a disconnected prototype.

---

## Persistent Posts

Posts are stored in the database instead of existing only in temporary frontend state.

Current post functionality includes:

- Persistent post creation
- PostgreSQL-backed storage
- Feed integration
- Profile post integration
- Server-side post retrieval

This means posts remain available after refreshes and application restarts as long as the database is preserved.

---

## Advanced Profile System

GUPTO NETWORK includes a detailed profile system where users can maintain both identity information and extended personal information.

Current profile capabilities include:

- Name
- Username
- Bio
- Profile photo
- Cover photo
- Category
- Birth date
- Current location
- Hometown
- School
- College
- University
- Relationship status
- Gender
- Email
- Phone number
- Website
- Multiple interests
- Multiple social links
- Multiple workplaces

Profile information is database-backed and persists between sessions.

---

## About Section

The profile About section presents user information in a structured order:

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

### About Field Management

Individual About fields support:

- Edit
- Delete
- Database-backed updates
- Database-backed deletion
- Conditional rendering when data is unavailable

When a supported field is deleted, the profile row is removed instead of leaving an empty placeholder.

Sensitive information such as birth date, email, and phone number can be presented with private visibility labeling.

---

## Workplace System

Workplaces support multiple entries.

A workplace can contain:

- Name only
- Link only
- Name and link

When a workplace URL is available, GUPTO NETWORK can display the corresponding organization favicon or logo when available.

Workplace links remain visually consistent with normal profile text while still being clickable.

---

## Social Links

Users can add multiple social or external links.

Examples include platforms such as:

- Facebook
- YouTube
- GitHub
- LinkedIn
- X
- Other supported websites

When possible, GUPTO NETWORK automatically displays the corresponding platform or website icon/logo.

Social links remain compact and visually consistent with the rest of the About interface.

---

## Interests

Users can select multiple interests from the profile editor.

Selected interests are stored with the user's profile and displayed in the About section.

The interface uses a clean light-bulb identity for the Interests field.

---

## Profile Categories

GUPTO NETWORK supports profile categories for representing different types of users.

The category system includes a growing collection of identities such as:

- Public Figure
- Developer / Tech
- Content Creator
- Fashion
- Beauty
- Travel
- Food-related categories
- Lifestyle categories
- Other creator and professional identities

Some categories use customized visual icons.

The current project also includes dedicated custom assets for:

- Beauty
- Fashion

Public Figure profiles use a dedicated identity badge integrated with the profile design.

---

## Profile Media

Users can manage:

- Profile photo
- Cover photo

Uploaded media is handled separately from source-controlled application code.

Runtime user uploads are intentionally excluded from Git tracking.

---

## Responsive Interface

The interface is designed for different screen sizes.

Current responsive functionality includes:

- Desktop layout
- Responsive profile page
- Responsive feed components
- Sidebar navigation
- Mobile header
- Mobile navigation
- Mobile profile controls

The desktop and mobile experiences share the same application data while adapting the interface for each viewport.

---

## Project Structure

```text
gupto-network/
│
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
├── data/
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
├── auth.ts
├── next.config.mjs
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

---

## Database

GUPTO NETWORK uses PostgreSQL with Prisma ORM.

The Prisma schema is located at:

```text
prisma/schema.prisma
```

Database evolution is tracked using Prisma migrations:

```text
prisma/migrations/
```

The repository contains the migration history required to recreate the current application schema.

---

## Getting Started

### Prerequisites

Install the following first:

- Node.js
- npm
- PostgreSQL or a supported Prisma PostgreSQL development environment
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/nuranayeem/gupto-network.git
```

Then enter the project:

```bash
cd gupto-network
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Configure Environment Variables

Create your local environment file from the example:

```bash
cp .env.example .env
```

On Windows PowerShell you can use:

```powershell
Copy-Item .env.example .env
```

Then configure the required values in `.env`.

> Never commit your real `.env` file or production secrets to GitHub.

---

### 4. Generate Prisma Client

```bash
npx prisma generate
```

---

### 5. Apply Database Migrations

```bash
npx prisma migrate dev
```

This creates or updates the local database schema using the migrations stored in the repository.

---

### 6. Start the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Prisma Development Database

When using Prisma's local development database workflow, start the database before running the application.

The project can then use the generated local PostgreSQL connection through the configured `DATABASE_URL`.

After the database is running:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

---

## Git-Ignored Local Data

Some files are intentionally not stored in GitHub.

Examples include:

```text
.env
node_modules/
.next/
generated/prisma/
public/uploads/
```

### Why?

- `.env` may contain private credentials
- `node_modules` can be restored with `npm install`
- `.next` is generated by Next.js
- Prisma generated output can be regenerated
- `public/uploads` contains runtime user-uploaded files

This keeps the repository clean and prevents local/private data from being accidentally committed.

---

## Restoring the Project on Another Computer

If the original development machine is lost or replaced, the project source can be restored from GitHub.

After cloning the repository:

```bash
npm install
```

Create the local `.env`, configure the database, then run:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

Application source code, Prisma schema, migrations, components, API logic, profile logic and committed assets will be restored from GitHub.

Local-only secrets, generated dependencies and runtime user uploads must be recreated or restored separately.

---

## Current Development Status

GUPTO NETWORK currently has a functional foundation for:

- Authentication
- Persistent database storage
- Persistent social posts
- Advanced user profiles
- Editable About information
- Profile media
- Multiple workplaces
- Multiple interests
- Multiple social links
- Profile categories
- Custom category identities
- Desktop and mobile responsive interfaces

Development is continuing incrementally as additional social networking functionality is added.

---

## Development Principles

The project follows several core principles:

### Persistent by Default

Important user information should be stored in the database rather than only in temporary frontend state.

### Clean Profile Experience

Profile information should remain structured, readable and visually consistent regardless of how much information a user adds.

### Responsive Design

Desktop and mobile interfaces should provide the same functionality without sacrificing usability.

### Safe Source Control

Secrets, generated dependencies and runtime user uploads should remain outside the Git repository.

### Incremental Development

New functionality is added carefully while preserving existing working behavior and interface consistency.

---

## Repository

GitHub repository:

```text
https://github.com/nuranayeem/gupto-network
```

---

## Project

**GUPTO NETWORK**

A growing full-stack social networking platform focused on persistent user identity, structured profiles, social content and a clean responsive experience.
