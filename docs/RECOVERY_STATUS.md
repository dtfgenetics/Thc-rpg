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

## Release gates

- [x] RPG kernel builds
- [x] shared battle package builds
- [x] Prisma client generates
- [ ] RPG kernel and shared package tests pass
- [x] API builds
- [ ] web application builds
- [ ] Grower's Grove boots in desktop and mobile browsers
- [ ] map interaction enters battle and returns to the map
- [ ] save/reload restores chapter progress
