# Audit and Fix Log

## Scope

This audit covers the current THC: Pheno Quest vertical playable slice branch.

The project currently contains:

- Seed Man as the locked main character
- cannabis parody world bible
- Next.js web app
- Express API
- PostgreSQL / Prisma schema
- shared battle math package
- RPG kernel package
- Phaser Grower’s Grove prototype
- battle engine
- inventory engine
- key tools and obstacles
- unlock flags
- dialogue
- quests
- recruitment
- party management
- save points / Cure Stations
- persistent companion HP
- GitHub Actions CI
- Docker local database

## What Was Good

### 1. Game identity is consistent

The playable identity is now clear:

```text
Seed Man explores cannabis-fantasy regions and leads recruitable strain companions.
```

The world is not a direct copy of any single game. It uses system inspiration only:

- exploration
- party combat
- timed attacks
- transformation meter
- item-gated map progression

### 2. Core RPG loops exist

The branch now has these loops:

```text
Explore → Interact → Quest → Tool use → Save → Battle → Reward → Recruit → Party management
```

### 3. Server-authoritative battle state exists

Damage, rewards, battle status, and persisted companion outcomes are calculated on the server instead of trusting the browser.

### 4. Cannabis parody tone is strong

Current named content fits the project:

- Seed Man
- Grower’s Grove
- Garden Keeper Nugsworth
- Rival Grower Ashtray
- Grinder Relic
- Vapor Lens
- Cure Station
- Brittle Resin Wall
- Skunk Scout

## Issues Identified and Fixed

### Fix 1 — Overworld auto-trigger issue

Problem:
Seed Man interactions triggered just by standing near objects. This could repeatedly pick up items, spam quest calls, and make the map feel less like a game.

Fix:
Grower’s Grove now requires an explicit interaction press.

```text
Move near object → press E or Space → action runs
```

This makes the prototype behave more like a real RPG.

### Fix 2 — Phaser TypeScript risk

Problem:
The Phaser scene used namespace-style Phaser type references inside a dynamically imported Phaser module. This could cause TypeScript/build issues depending on Phaser’s exported type behavior.

Fix:
The scene now avoids fragile namespace type references in the component and keeps Phaser as the runtime module import.

### Fix 3 — Quest XP was defined but not applied

Problem:
Quest rewards had an `xp` field, but claiming a quest only handled Kush Coin, Reputation, items, and unlocks.

Fix:
Quest XP is now applied to the active party when a quest reward is claimed.

### Fix 4 — Recruited companions had no initial persistent HP

Problem:
New recruited companions were created with level and XP but no `currentHp` value.

Fix:
Recruitment now initializes a recruited companion’s `currentHp` to its scaled max HP.

### Fix 5 — Consumables consumed items without applying HP effects

Problem:
Terp Tonic had a `HEAL_HP` effect, but using it only consumed the item and reported the effect as queued.

Fix:
Consumables with `HEAL_HP` now actually restore companion HP.

If no target is supplied, the system heals the most wounded owned companion.

Optional API target:

```json
{
  "playerId": "player_id",
  "itemSlug": "terp-tonic",
  "targetCompanionId": "optional_companion_id"
}
```

### Fix 6 — Inventory use API needed target support

Problem:
The inventory API accepted only `playerId` and `itemSlug`.

Fix:
`POST /inventory/use` now accepts optional `targetCompanionId`.

## Still Needs Verification

These need to be run locally or in CI:

```bash
npm install
npm run db:up
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build
npm test
npm run dev:api
npm run dev:web
```

Manual route checks:

```text
/games/pheno-quest/grove
/games/pheno-quest
/games/pheno-quest/party
```

Manual gameplay checks:

1. Load dev player.
2. Enter Grower’s Grove.
3. Confirm objects do not trigger until E/Space is pressed.
4. Talk to Garden Keeper Nugsworth.
5. Pick up Grinder Relic.
6. Clear Resin Wall.
7. Use Cure Station.
8. Start battle.
9. Win battle.
10. Confirm XP/rewards save.
11. Recruit Skunk Scout.
12. Add Skunk Scout to party.
13. Take damage in battle.
14. Confirm HP persists after battle.
15. Use Terp Tonic to heal companion HP.
16. Use Cure Station to full recover.

## Highest Priority Remaining Fixes

### 1. Real CI result

The branch needs an actual build/test result before merging.

### 2. Battle-map transition

Grower’s Grove still points the player toward the battle screen instead of directly starting a battle and returning after the result.

### 3. Quest journal UI

Quest data exists, but the player cannot yet open a clean quest journal.

### 4. Real dialogue box

Dialogue data exists, but the map currently shows simple action text. It needs a real dialogue UI with speaker name, portrait, and choices.

### 5. Map save coordinates

Save state records the save point and region, but not exact Seed Man coordinates/facing direction yet.

### 6. Mobile controls

The game must be playable on the website, so touch joystick and interact buttons are required.

## Current Recommendation

Do not add a second region yet.

First finish Grower’s Grove as a polished playable chapter:

```text
Seed Man intro
→ quest dialogue
→ tool pickup
→ obstacle clear
→ Cure Station
→ rival battle
→ reward
→ recruit
→ party management
→ unlock next path
```

Once that loop works without breaking, add Sativa Summit as Region 2.
