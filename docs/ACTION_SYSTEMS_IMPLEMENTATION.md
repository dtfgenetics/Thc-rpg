# Action Systems Implementation

## Purpose

This document defines the code required for player actions outside battle. These systems are the bridge between the battle prototype and the Zelda-style map game.

## Implemented Action Loop

```text
player picks up item
→ API validates item exists
→ database stores item stack
→ frontend displays inventory
→ player uses key tool on map obstacle
→ API validates player owns required tool
→ database stores unlock flag
→ frontend displays cleared unlock
```

## New Package

```text
packages/rpg-kernel
```

This package owns reusable RPG system types:

- item types
- inventory stack types
- interaction result types
- map obstacle types
- region state types
- save/progress state types

## New Database Models

### ItemTemplate

Defines every item, key tool, relic, quest item, material, and later genetics item.

Important fields:
- slug
- name
- kind
- description
- stackable
- useContext
- effectJson

### PlayerInventoryItem

Stores player-owned item stacks.

Important fields:
- playerId
- itemId
- quantity

### MapObstacleTemplate

Defines a map blocker that requires a key tool.

Important fields:
- slug
- name
- regionSlug
- requiredItemSlug
- clearedUnlockSlug

### PlayerUnlock

Stores permanent player progress flags.

Important fields:
- playerId
- slug
- source

## New Seed Data

### Items

- Terp Tonic — consumable test item
- Grinder Relic — key tool for brittle resin walls
- Vapor Lens — key tool for hidden smoke paths
- Trimmer Blade — future key tool for overgrowth gates

### Obstacles

- Brittle Resin Wall — requires Grinder Relic
- Hidden Smoke Path — requires Vapor Lens

## New API Routes

### `GET /inventory/:playerId`

Loads inventory and unlocks.

### `POST /inventory/pickup`

Grants an item to the player.

Body:

```json
{
  "playerId": "player_id",
  "itemSlug": "grinder-relic",
  "quantity": 1
}
```

### `POST /inventory/use`

Consumes a non-key-tool item.

Body:

```json
{
  "playerId": "player_id",
  "itemSlug": "terp-tonic"
}
```

### `POST /interactions/use-tool`

Uses a key tool on a map obstacle and saves the unlock flag.

Body:

```json
{
  "playerId": "player_id",
  "toolSlug": "grinder-relic",
  "obstacleSlug": "resin-wall-grove"
}
```

## Frontend Test UI

The `/games/pheno-quest` route now includes an Action System Test panel.

It can:
- pick up Terp Tonics
- pick up Grinder Relic
- pick up Vapor Lens
- use Grinder Relic on Resin Wall
- use Vapor Lens on Smoke Path
- show inventory
- show unlock flags

## Why This Matters

This proves the map-interaction code before we build the full Phaser map.

When Phaser is added later, the map will call the same API route:

```text
/interactions/use-tool
```

That means the future visual map will not need custom rules. It will use the same server-owned action system.
