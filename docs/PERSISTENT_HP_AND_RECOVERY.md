# Persistent HP and Recovery System

## Purpose

The game now needs damage and recovery to matter outside a single battle screen. Seed Man should not be able to ignore companion damage after a fight.

## Added System

```text
persistent companion HP
```

Player-owned companions now have an optional persistent `currentHp` value in the database.

## Database Update

```text
PlayerCompanion.currentHp
```

This stores each companion's overworld/current HP between battles.

## Battle Start Rule

When a battle starts, the battle engine uses the saved HP from the database.

```text
saved currentHp → battle currentHp
```

If all active companions are fainted, the battle does not start.

The player must use a Cure Station first.

## Battle Win Rule

When the player wins:

- XP is awarded
- Kush Coin is awarded
- Reputation is awarded
- companion level/XP is saved
- companion remaining HP is saved back to the database

## Battle Loss Rule

When the player loses:

- Seed Man is treated as being returned to the last Cure Station
- active companions are left at 1 HP
- the player must use a Cure Station to fully recover

## Cure Station Rule

When Seed Man uses a Cure Station:

- save state is updated
- save point is marked visited
- save-point unlock flag is written
- every owned companion is restored to max HP

## Why This Matters

This creates a real RPG resource loop:

```text
battle damage matters
→ Cure Stations matter
→ battle loss matters
→ party management matters
→ map recovery points matter
```

## Current Limitation

This is still a vertical slice recovery system. It does not yet store exact Seed Man map coordinates, region spawn point coordinates, status effect persistence, or item-based healing outside battle.

## Next Upgrade

Add region spawn coordinates and respawn routing.

Needed fields later:

```text
PlayerSaveState.spawnX
PlayerSaveState.spawnY
PlayerSaveState.facingDirection
```

This will allow the web map to place Seed Man at the exact Cure Station after reloading or losing a battle.
