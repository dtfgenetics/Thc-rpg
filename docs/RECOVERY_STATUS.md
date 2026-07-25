# Game Recovery Status

This branch is the authoritative recovery line for THC: Pheno Quest.

## Immediate goals

1. Restore a clean monorepo build.
2. Preserve the server-authoritative battle, progression, inventory, quest, party, recruitment, and save systems.
3. Integrate the proven overworld movement, interaction, touch-control, animation, and reaction-audio systems.
4. Produce one complete Grower's Grove loop before adding another region.

## Release gates

- RPG kernel builds and tests
- shared battle package builds and tests
- Prisma client generates
- API builds
- web application builds
- Grower's Grove boots in desktop and mobile browsers
- map interaction enters battle and returns to the map
- save/reload restores chapter progress
