# Open Source Engine Strategy

## Goal

Use free/open-source code and our existing THC game work creatively, while keeping THC: Pheno Quest playable on the website and cheap to host.

## Best Direction

Build our own small THC web RPG engine on top of free browser tools.

Working name:

```text
THC Web RPG Kernel
```

This is not a huge custom 3D engine. It is a reusable web-game framework made from the systems we already need:

- scene/router system
- battle engine
- inventory system
- tilemap movement
- interaction triggers
- dialogue boxes
- save/load API
- asset manifest loader
- audio manager
- UI shell

## Use Our Own Existing Work

We already have a THC browser-games workspace in `dtfgenetics/Thc` with High Land code planned under `/apps/high-land-web`, Supabase structure under `/supabase`, and a route/deployment target for `dtfseeds.com` / `dtf420.com`.

Reuse patterns from that repo where useful:

- browser game app structure
- DTF/THC branding rules
- route/deployment expectations
- Supabase notes if we choose Supabase instead of VPS PostgreSQL
- testing/build discipline
- no-secrets rules

Do not blindly copy High Land gameplay into Pheno Quest. Reuse infrastructure patterns, not game rules.

## Recommended Stack

### Core App

```text
Next.js + TypeScript
```

Use for:
- website route
- menus
- battle UI
- inventory UI
- party UI
- save/load screens

### Battle Engine

```text
Custom TypeScript engine
```

Use our own code for:
- turn validation
- damage math
- timing bonus caps
- awakening state
- rewards

### Overworld Engine

Preferred:

```text
Phaser
```

Use for:
- Zelda-style map movement
- tilemaps
- collision
- NPC interaction
- pickups
- transitions

### Alternative Overworld Engine

Possible:

```text
Excalibur.js
```

Why consider it:
- TypeScript-first
- free and open source
- browser-focused
- simpler than Phaser for some actor/component scenes

### RPG-Specific Option

Possible, but not default:

```text
RPGJS
```

Why consider it:
- free MIT-licensed RPG engine
- JavaScript/TypeScript workflow
- already RPG-focused

Why not default:
- may force us into its assumptions
- we already have battle/API architecture started
- paid Studio workflow is optional but not part of zero-spend plan

### Godot Option

Possible later:

```text
Godot web export
```

Why not default:
- splits the project into a separate engine/editor workflow
- less direct integration with Next.js/API code
- better for a standalone exported game than a deeply integrated website game

## What Not To Do

Avoid:

- Unreal for v1 website build
- Unity for v1 website build
- paid asset stores
- paid RPG Maker-style tools
- proprietary engine code
- code with unclear license
- always-on realtime multiplayer systems

## Free Code Reuse Rules

Before using any open-source code:

1. Confirm license.
2. Confirm commercial use is allowed if we may ever sell merch, ads, or premium cosmetics.
3. Copy the license into `/licenses` if required.
4. Keep third-party code isolated in a package/folder.
5. Do not mix GPL code into core app unless we accept the obligations.
6. Prefer MIT, BSD, Apache-2.0, and permissive licenses.

## Creative Hybrid Plan

Use the current repo as the canonical game repo, but split the engine into reusable internal packages:

```text
packages/
  shared/          battle types and math
  rpg-kernel/      scenes, entities, events, inventory rules
  asset-pipeline/  manifest validation and image/audio loading
```

Then app code becomes:

```text
apps/
  web/             Next.js website/game route
  api/             Express server and Prisma database
```

## Engine Ownership Decision

We should not rely on one big third-party RPG engine. We should own the core game logic and use open-source libraries only where they save time.

Own ourselves:
- battle math
- inventory rules
- progression
- companions
- recruitment
- save format
- quests
- map events

Borrow from open source:
- rendering
- tilemap loading
- path/collision helpers
- audio playback
- UI helpers

## Next Build Step

Create `packages/rpg-kernel` with:

- entity types
- inventory types
- item definitions
- interaction event types
- region/map types
- save-state types

Then wire inventory/key tools into API and frontend.
