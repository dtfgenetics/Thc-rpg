# THC: Pheno Quest

A cannabis-fantasy RPG vertical playable slice for the THC / DTF game hub.

## Locked Direction

THC: Pheno Quest is a turn-based strain-companion RPG inspired by:

- **Zelda-style progression:** small regions and cultivation-tool-gated exploration.
- **Final Fantasy-style party combat:** strain companions with clear roles.
- **Legend of Dragoon-style timing attacks:** Strain Addition timed inputs during server-authoritative turns.

The game is **not** an idle grow game and not a real-time multiplayer game.

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

## Current Build Path

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev:api
npm run dev:web
```

## Repo Structure

```text
apps/
  api/      Express + Prisma backend
  web/      Next.js frontend
packages/
  shared/   Shared TypeScript types and battle math
docs/       Game mechanics, vertical slice, deployment notes
tasks/      Implementation checklist
```

## Production Target

The target game hub is `dtfseeds.com`, with a future playable route such as:

```text
/games/pheno-quest/
```

The safest deployment model is a static/frontend site on the existing hub plus an API/database backend hosted on the VPS or a managed backend.
