# Deployment Runbook — Website/VPS

## Goal

Run THC: Pheno Quest independently and expose it through the existing website/game hub.

## Recommended Production Shape

```text
Frontend: Next.js app
Route: /games/pheno-quest
Backend: Express API
Database: PostgreSQL
Process manager: PM2 or systemd
Reverse proxy: Nginx or hosting panel proxy
SSL: existing site certificate or Let's Encrypt
```

## Option A — Same VPS Hosts Everything

Best when you want full control.

Needs:
- Node.js 20+
- PostgreSQL
- Git
- PM2 or systemd
- Nginx
- SSL

Flow:

```bash
git clone https://github.com/dtfgenetics/Thc-rpg.git
cd Thc-rpg
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build
```

Run API:

```bash
npm run start -w apps/api
```

Run frontend:

```bash
npm run start -w apps/web
```

## Option B — Website Links To Game Subdomain

Simpler if the current website is WordPress or hard to modify.

Use:

```text
game.dtfseeds.com
```

Main site button:

```text
Play THC: Pheno Quest
```

## Option C — Existing Site Embeds Game

Useful for fastest testing.

Use an iframe to embed the hosted game page.

Downside:
- mobile sizing can be annoying
- login/session handling can be harder later

## Environment Variables

API:

```text
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://dtfseeds.com
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/thc_pheno_quest?schema=public
```

Web:

```text
NEXT_PUBLIC_API_URL=https://api.dtfseeds.com
```

## Health Check

After deployment, verify:

```text
GET /health
```

Expected:

```json
{ "status": "ok" }
```

## Launch Checklist

- API boots without errors
- database migrations complete
- seed data exists
- `/health` responds
- web route loads
- dev player can be created
- battle starts
- turn resolves
- victory/defeat can be reached
- rewards save

## Production Warning

Do not put `DATABASE_URL`, tokens, or passwords into frontend code. Only the backend should know database credentials.
