# Local Development Guide

## Goal

Run THC: Pheno Quest independently on your machine before deploying to the website.

## Requirements

- Node.js 20+
- npm
- Docker Desktop, or a locally installed PostgreSQL server
- Git

## Fast Setup With Docker PostgreSQL

From the repo root:

```bash
npm run setup:local
```

This will:

1. install npm dependencies
2. start PostgreSQL in Docker
3. generate the Prisma client
4. run database migrations
5. seed starter game data

## Manual Setup

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run db:up
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Run The API

```bash
npm run dev:api
```

API health check:

```text
http://localhost:4000/health
```

Expected response:

```json
{ "status": "ok" }
```

## Run The Web App

Open another terminal:

```bash
npm run dev:web
```

Open:

```text
http://localhost:3000/games/pheno-quest
```

## First Test Flow

1. Click `Load Dev Player`.
2. Click `Start Rival Battle`.
3. Select a move.
4. Wait close to 900ms.
5. Click `Resolve Timing`.
6. Repeat until battle ends.
7. Confirm rewards appear on victory.

## Database Tools

Open Prisma Studio:

```bash
npm run db:studio
```

Stop local PostgreSQL:

```bash
npm run db:down
```

## Troubleshooting

### Port 5432 already in use

Another PostgreSQL server is already running. Either stop it or change the mapped Docker port in `docker-compose.yml`.

### API cannot connect to database

Check `apps/api/.env` and confirm:

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/thc_pheno_quest?schema=public"
```

### Frontend cannot reach API

Check `apps/web/.env.local` and confirm:

```text
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Prisma client errors

Run:

```bash
npm run db:generate
```

## Build Check

Before deploying:

```bash
npm run build
npm test
```
