# THC: Pheno Quest

A cannabis-fantasy RPG vertical playable slice for the THC / DTF game hub.

## Locked Direction

THC: Pheno Quest is a turn-based strain-companion RPG inspired by:

- **Zelda-style progression:** small regions and cultivation-tool-gated exploration.
- **Final Fantasy-style party combat:** strain companions with clear roles.
- **Legend of Dragoon-style timing attacks:** Strain Addition timed inputs during server-authoritative turns.

The game is **not** an idle grow game and not a real-time multiplayer game.

## What Exists In This Branch

This branch contains the first real build foundation:

- npm workspace monorepo
- shared TypeScript battle package
- Prisma database schema
- starter seed data
- Express API
- server-authoritative battle engine
- simple Next.js battle page
- route target: `/games/pheno-quest`
- Docker Compose PostgreSQL for local development
- GitHub Actions CI for build/test/database validation

## Vertical Playable Slice 1

The first build proves the combat loop before the project expands into overworld, breeding, trading, guilds, or async PvP.

### MVP Includes

- 3 starter strain companions:
  - Blue Mango — Hybrid / Fruit balanced attacker-support
  - Sour Diesel — Sativa / Gas speed striker
  - Granddaddy Purple — Indica / Purple tank/debuffer
- 1 NPC rival battle
- Turn-based combat
- Server-side turn validation
- Server-side damage calculation
- Strain Addition timing result support
- Pheno Awakening meter and temporary transformation state
- XP/reward result screen

### MVP Excludes

- No breeding yet
- No marketplace yet
- No guilds yet
- No live multiplayer rooms
- No Colyseus
- No always-on real-time sync
- No full overworld until combat feels good

## Local Setup

Requirements:

- Node.js 20+
- npm
- Docker Desktop, or your own PostgreSQL server

Fast setup:

```bash
npm run setup:local
```

Manual setup:

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run db:up
npm run db:generate
npm run db:migrate
npm run db:seed
```

Run the API:

```bash
npm run dev:api
```

Run the web app in another terminal:

```bash
npm run dev:web
```

Open:

```text
http://localhost:3000/games/pheno-quest
```

API health check:

```text
http://localhost:4000/health
```

Expected response:

```json
{ "status": "ok" }
```

## Repo Structure

```text
apps/
  api/      Express + Prisma backend
  web/      Next.js frontend
packages/
  shared/   Shared TypeScript types and battle math
docs/       Game mechanics, schema, API, deployment notes
tasks/      Implementation checklist
```

## Core API Routes

```text
GET  /health
POST /dev/player
GET  /players/:playerId
POST /battles/start
GET  /battles/:battleId
POST /battles/:battleId/turn
POST /battles/:battleId/awaken
```

## Production Target

The target game hub is `dtfseeds.com`, with a playable route such as:

```text
/games/pheno-quest/
```

The safest deployment model is:

```text
Frontend: Next.js route on the website or game subdomain
Backend: Express API on VPS
Database: PostgreSQL on VPS or managed Postgres
Reverse proxy: Nginx or hosting panel routing
```

Do not expose database credentials to the frontend.
