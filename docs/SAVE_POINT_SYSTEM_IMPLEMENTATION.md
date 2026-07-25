# Save Point / Cure Station System Implementation

## Purpose

THC: Pheno Quest now needs a safe-point loop so Seed Man can recover and save progress inside cannabis-fantasy regions.

## New System Added

```text
Cure Station / Save Point system
```

## Cannabis Parody Identity

The first save point is:

```text
Grower’s Grove Cure Station
```

It is a clone-dome style recovery station where Seed Man can rest, recover, and lock in progress before rival fights or deeper region travel.

## New RPG Kernel File

```text
packages/rpg-kernel/src/savePointTypes.ts
```

Defines:

- `SavePointTemplateView`
- `PlayerSaveStateView`
- `SavePointUseResult`

## New Database Models

### SavePointTemplate

Defines reusable save/recovery points.

Fields:
- `slug`
- `name`
- `regionSlug`
- `description`
- `recoveryType`
- `unlockSlug`

### PlayerSaveState

Stores the player’s latest save point and region.

Fields:
- `playerId`
- `activeRegionSlug`
- `lastSavePointSlug`
- `lastSavedAt`

### PlayerSavePointVisit

Tracks which save points the player has discovered or used.

Fields:
- `playerId`
- `savePointSlug`
- `visitedAt`

## New Seed Data

```text
growers-grove-cure-station
```

Visible name:

```text
Grower’s Grove Cure Station
```

## New Backend Service

```text
apps/api/src/services/savePointEngine.ts
```

Handles:

- loading player save state
- listing save points by region
- using a save point
- creating/updating player save state
- marking the save point as visited
- writing the save-point unlock flag

## New API Routes

```text
GET  /savepoints/player/:playerId
GET  /savepoints/region/:regionSlug
POST /savepoints/use
```

## Grower’s Grove Integration

The Phaser map now includes a Cure Station object.

Seed Man can walk into it to call:

```text
POST /savepoints/use
```

Request:

```json
{
  "playerId": "player_id",
  "savePointSlug": "growers-grove-cure-station"
}
```

Response saves:

- active region
- last save point
- last saved timestamp
- visited save point
- unlock flag

## Current Recovery Scope

V1 records save/recovery state. Full persistent HP restoration is not fully needed yet because player companion current HP is currently battle-state-only. Once persistent overworld HP is added, Cure Stations should also restore saved companion HP.

## Why This Matters

The first chapter loop is now stronger:

```text
Seed Man enters Grower’s Grove
→ talks to Garden Keeper Nugsworth
→ picks up Grinder Relic
→ clears Brittle Resin Wall
→ uses Cure Station
→ fights Rival Grower Ashtray
→ recruits Skunk Scout
→ manages party
```

## Next Upgrade

Add persistent companion current HP and battle recovery state.

This would allow:

- companion HP persists outside battle
- Cure Station restores roster HP
- losing a battle returns Seed Man to last Cure Station
- future regions can use checkpoints
