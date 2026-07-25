# Game Recovery Status

This branch is the authoritative recovery line for THC: Pheno Quest.

## Immediate goals

1. Restore a clean monorepo build.
2. Preserve the server-authoritative battle, progression, inventory, quest, party, recruitment, and save systems.
3. Integrate the proven overworld movement, interaction, touch-control, animation, and reaction-audio systems.
4. Produce one complete Grower's Grove loop before adding another region.

## Completed recovery work

- Established one recovery branch from the larger 150-commit RPG foundation.
- Added package-by-package diagnostic builds and compiler-report artifacts.
- Confirmed the RPG kernel, shared battle package, API, and Next.js/Phaser web application build successfully.
- Confirmed Prisma client generation, database migration, and seed data succeed.
- Fixed strict Prisma JSON boundaries for battle logs, item effects, quest steps, and recruitment requirements.
- Fixed the Phaser game reference type that blocked the Next.js production build.
- Fixed compiled test discovery and confirmed the existing test suite passes.
- Added authoritative seeded-data validation for companions, moves, NPC parties, items, obstacles, dialogue, quests, recruitment, and save points.
- Added a complete server-side Grower's Grove verification covering quest progression, Grinder Relic pickup, Resin Wall clearing, Cure Station recovery/save, gated Ashtray battle, victory unlock, and Skunk Scout recruitment.
- Connected Grower's Grove rival interaction to the battle route and added return-to-map handling.
- Enforced server-side chapter order: the wall quest must be claimed before Ashtray, and Skunk Scout requires both quest completion and Ashtray victory.
- Added desktop and mobile Playwright verification with rendered screenshots, traces, and server logs.
- Fixed concurrent demo-player initialization so simultaneous desktop/mobile sessions cannot collide on the unique player handle.

## Release gates

- [x] RPG kernel builds
- [x] shared battle package builds
- [x] Prisma client generates
- [x] database migrates and seeds
- [x] authoritative game data validation passes
- [x] RPG kernel and shared package tests pass
- [x] API builds
- [x] web application builds
- [x] complete server-side Grower's Grove chapter flow passes
- [ ] Grower's Grove boots cleanly in desktop and mobile browsers
- [ ] rendered map-to-battle and return flow passes browser verification
- [ ] exact map position and defeat respawn restore after save/reload
- [ ] production Seed Man, creature, environment, UI, and audio assets replace placeholders
