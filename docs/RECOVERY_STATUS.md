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
- Confirmed the RPG kernel builds successfully.
- Confirmed the shared battle package builds successfully.
- Confirmed Prisma client generation succeeds.
- Fixed strict Prisma JSON boundaries for battle logs, item effects, quest steps, and recruitment requirements.
- Confirmed the API package builds successfully after those corrections.
- Fixed the Phaser game reference type that blocked the Next.js production build.
- Confirmed the Next.js/Phaser production build succeeds.
- Fixed compiled test discovery and confirmed the existing test suite passes.
- Added authoritative seeded-data validation for companions, moves, NPC parties, items, obstacles, dialogue, quests, recruitment, and save points.
- Aligned optional tool unlock validation with the actual ItemEffect contract; obstacle records remain the authoritative unlock source.

## Release gates

- [x] RPG kernel builds
- [x] shared battle package builds
- [x] Prisma client generates
- [x] RPG kernel and shared package tests pass
- [x] API builds
- [x] web application builds
- [ ] authoritative game data validation passes
- [ ] Grower's Grove boots in desktop and mobile browsers
- [ ] map interaction enters battle and returns to the map
- [ ] save/reload restores chapter progress
