# Party System Implementation

## Purpose

Seed Man can now recruit strain companions, so the game needs a roster and active party management system. This connects recruitment to battle readiness.

## New System Added

```text
Party roster + active party management
```

## New RPG Kernel File

```text
packages/rpg-kernel/src/partyTypes.ts
```

Defines:

- `CompanionRosterView`
- `PartyStateView`
- `PartyActionResult`

## New Backend Service

```text
apps/api/src/services/partyEngine.ts
```

Handles:

- loading full companion roster
- loading active party
- adding a companion to active party
- removing a companion from active party
- swapping active party positions
- enforcing max party size
- keeping at least one active companion

## New API Routes

```text
GET  /party/:playerId
POST /party/add
POST /party/remove
POST /party/swap
```

## New Frontend Route

```text
/games/pheno-quest/party
```

This screen lets the player:

- view Seed Man's full companion roster
- see companion stats
- see known moves
- see Awakening names
- see current active party slots
- add recruited companions to the active party
- remove companions from the active party
- swap positions between active companions

## Active Party Rule

The first version uses a maximum party size of 3.

```text
MAX_PARTY_SIZE = 3
```

This keeps the battle engine simple while still feeling like a party RPG.

## Why This Matters

The first chapter can now flow like this:

```text
Seed Man clears the Resin Wall
→ Garden Keeper Nugsworth rewards the quest
→ Skunk Scout joins Seed Man's roster
→ player opens party screen
→ player adds Skunk Scout to active party
→ future battles can include Skunk Scout
```

## Cannabis Parody Fit

The roster system supports the central identity:

```text
Seed Man leads a crew of strain companions.
```

The player is not collecting generic monsters. They are recruiting cannabis-fantasy companions tied to regions, grower culture, genetics, and pheno progression.

## Next Upgrade

The next logical system is the Cure Station / save-point system.

That should support:

- restore party HP
- save current progress
- mark respawn/return point
- give Seed Man a safe hub interaction

Suggested first save point:

```text
Grower’s Grove Cure Station
```
