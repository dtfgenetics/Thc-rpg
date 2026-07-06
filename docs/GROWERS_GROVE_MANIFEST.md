# Grower’s Grove Manifest

## Purpose

Grower’s Grove was becoming too hardcoded inside the Phaser scene. Object positions, labels, colors, interaction radii, and hints now live in a small region manifest.

## Manifest File

```text
apps/web/app/games/pheno-quest/grove/growersGroveManifest.ts
```

## What It Defines

The manifest exports:

```text
GROWERS_GROVE_REGION_SLUG
growersGroveEntities
GroveEntityDefinition
GroveEntityKind
```

## Entity Kinds

```text
ITEM
OBSTACLE
NPC
SAVE_POINT
BATTLE_TRIGGER
```

## Entity Fields

Each region entity can define:

- `slug`
- `kind`
- `label`
- `x`
- `y`
- `radius`
- `color`
- `hint`

## Why This Is Better

Before this change, Grower’s Grove had hardcoded draw calls and hardcoded interaction target lists inside the React/Phaser component.

Now the scene reads a manifest and uses that data to:

- draw the correct object type
- register removable objects
- build proximity interaction targets
- decide which action belongs to each slug

## Current Entities

Grower’s Grove currently defines:

- Garden Keeper Nugsworth
- Terp Tonic
- Grinder Relic
- Vapor Lens
- Brittle Resin Wall
- Hidden Smoke Path
- Grower’s Grove Cure Station
- Rival Grower Ashtray

## Current Limitation

Action routing still lives in `GrowersGroveGame.tsx` because each slug maps to a different API call.

The next refactor should move action routing into a small resolver file.

Suggested file:

```text
apps/web/app/games/pheno-quest/grove/growersGroveActions.ts
```

## Rule Going Forward

Future regions should start with a manifest before writing custom Phaser scene code.

Recommended future region pattern:

```text
regionManifest.ts
regionActions.ts
RegionGame.tsx
```

This lets us build Sativa Summit and later regions without repeating the Grower’s Grove hardcoded structure.
