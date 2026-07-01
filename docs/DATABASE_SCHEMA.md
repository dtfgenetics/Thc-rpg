# Database Schema — Vertical Playable Slice 1

## Purpose

The database stores the server-owned state. The browser renders the game, but it does not own battle results, rewards, XP, inventory, or progression.

## Core Tables Implemented

### Player

Stores the playable account or dev test account.

Fields:
- `id`
- `handle`
- `kushCoin`
- `reputation`
- timestamps

### CompanionTemplate

The base strain-companion definition. This is the reusable species/template.

Fields:
- `slug`
- `name`
- `primaryType`
- `secondaryType`
- `role`
- `baseHp`
- `potency`
- `vigor`
- `speed`
- `resin`
- `terpenes`
- `stability`
- `awakeningName`
- `starter`

### MoveTemplate

The reusable move/ability definition.

Fields:
- `slug`
- `name`
- `type`
- `kind`
- `basePower`
- `accuracy`
- `meterGain`
- `timingPattern`
- `goodBonusCap`
- `perfectBonusCap`
- `statusEffect`
- `awakeningOnly`
- `cooldown`

### TemplateMove

Join table connecting companion templates to legal moves.

Fields:
- `companionTemplateId`
- `moveTemplateId`
- `levelRequired`

### PlayerCompanion

A player-owned strain companion instance.

Fields:
- `playerId`
- `templateId`
- `nickname`
- `level`
- `xp`

Later expansion:
- pheno variance
- rarity
- breeding lineage
- custom move unlocks

### PartySlot

Defines the active party order.

Fields:
- `playerId`
- `companionId`
- `position`

### NpcTemplate

Stores NPC rival/boss data.

Fields:
- `slug`
- `name`
- `partyJson`

### Battle

Stores the complete server-owned battle state.

Fields:
- `playerId`
- `npcSlug`
- `status`
- `turnNumber`
- `activeSide`
- `state`
- `log`
- `rewardsJson`

## Why Battle State Uses JSON In V1

The vertical slice is still proving combat feel. Keeping the active battle snapshot as JSON makes the turn engine faster to iterate. Once combat stabilizes, we can normalize deeper battle records if needed.

## Later Tables

Not implemented yet:
- InventoryItem
- PlayerInventory
- Region
- MapState
- Quest
- RecruitEvent
- BreedingPair
- MarketListing
- AsyncBattleSnapshot
- Guild

These wait until the combat loop is playable.
