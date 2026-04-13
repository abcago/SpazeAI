# SpazeAI

AI-powered image generation platform consisting of an iOS app, REST API, admin backoffice, and marketing landing page.

## Architecture

```
SpazeAI-All/
├── SpazeAI/          # iOS app (SwiftUI)
├── api/              # REST API (Hono + TypeScript)
├── backoffice/       # Admin dashboard (Next.js)
├── landing/          # Marketing site (Next.js)
└── docker-compose.yml
```

| Service      | Tech Stack                          | Port  |
|-------------|-------------------------------------|-------|
| **API**     | Hono, Drizzle ORM, PostgreSQL, Zod  | 3001  |
| **Backoffice** | Next.js 16, NextAuth, Redux, Recharts, Tailwind | 3000  |
| **Landing** | Next.js 16, React 19, Tailwind      | 3002  |
| **iOS App** | SwiftUI, Sign in with Apple          | —     |
| **Database**| PostgreSQL 16                        | 5432  |

## Key Features

- **AI Image Generation** — Transform photos using FAL.ai with 20+ style presets (anime, cyberpunk, oil painting, pixel art, etc.)
- **Coin-Based Economy** — Users purchase or earn coins to generate images
- **Subscription Plans** — Tiered subscription system
- **Admin Backoffice** — Manage users, generations, content moderation, and analytics
- **Feed & Gallery** — Social feed of public generations and personal gallery

## Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js](https://nodejs.org/) >= 20 (for local development)
- [Xcode](https://developer.apple.com/xcode/) 15+ (for iOS app)

## Getting Started

### 1. Clone & configure environment

```bash
git clone <repo-url>
cd SpazeAI-All
cp .env.example .env
```

Edit `.env` and fill in your actual credentials (R2, FAL.ai, Google OAuth, etc.).

### 2. Start with Docker Compose

```bash
docker compose up -d
```

This starts PostgreSQL, the API, backoffice, and landing page.

### 3. Run database migrations & seed

```bash
cd api
npm install
npm run db:migrate
npm run db:seed
```

### 4. Access the services

| Service     | URL                          |
|------------|------------------------------|
| API        | http://localhost:3001         |
| API Docs   | http://localhost:3001/docs    |
| Health     | http://localhost:3001/api/health |
| Backoffice | http://localhost:3000         |
| Landing    | http://localhost:3002         |

## Local Development (without Docker)

### API

```bash
cd api
npm install
cp .env.example .env   # configure your database URL and secrets
npm run dev             # starts with hot-reload on :3001
```

### Backoffice

```bash
cd backoffice
npm install
npm run dev             # starts on :3000
```

### Landing

```bash
cd landing
npm install
npm run dev             # starts on :3002
```

### iOS App

Open `SpazeAI/SpazeAI.xcodeproj` in Xcode and run on a simulator or device.

## API Overview

| Endpoint                  | Description                    |
|--------------------------|--------------------------------|
| `POST /api/auth/*`       | Registration, login, tokens    |
| `GET  /api/generation-types` | Available generation styles |
| `POST /api/generations`  | Create an image generation     |
| `GET  /api/feed`         | Public generation feed         |
| `GET  /api/profile`      | User profile                   |
| `GET  /api/coin-packages`| Available coin packages        |
| `GET  /api/subscription-plans` | Subscription tiers        |
| `*    /api/admin/*`      | Admin-only endpoints           |

## Database

- **ORM**: Drizzle ORM with PostgreSQL driver
- **Migrations**: `npm run db:generate` / `npm run db:migrate`
- **Studio**: `npm run db:studio` (visual DB browser)
- **Seeding**: `npm run db:seed`

## Environment Variables

See [`.env.example`](.env.example) for the full list of required variables. Key groups:

- **PostgreSQL** — database credentials
- **JWT** — access & refresh token secrets
- **Cloudflare R2** — S3-compatible object storage for generated images
- **FAL.ai** — AI image generation API
- **Google OAuth** — backoffice admin authentication

## Project Structure (API)

```
api/src/
├── db/              # Database schema, migrations, seeds
├── lib/             # Shared utilities (env, jwt, r2, schemas)
├── middleware/       # Auth & error handling middleware
├── routes/          # Route handlers by domain
│   ├── admin/
│   ├── auth/
│   ├── generations/
│   ├── feed/
│   └── ...
└── index.ts         # App entry point
```
