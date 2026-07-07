# THC: Pheno Quest — Finish Plan

## Goal

Turn the concept into a finished playable RPG by identifying, creating, and implementing every required mechanic, asset, and interaction in the correct order.

## The Problem To Avoid

Do not create random assets before the mechanics are locked. Do not create huge lore documents before the vertical slice plays correctly. Every asset must connect to a code interaction.

## What Must Be Improved First

### 1. Clear Game Identity

Locked identity:

THC: Pheno Quest is a cannabis fantasy RPG mashup of Zelda, Final Fantasy, and Legend of Dragoon.

Core pillars:
- Zelda: movement, regions, exploration, puzzles, tool-gated progression
- Final Fantasy: party, HP, stats, turn-based battles, XP, items, bosses
- Legend of Dragoon: timed combo attacks and transformation meters
- Cannabis identity: recruitable strain companions, pheno awakenings, terpene effects, genetics, grow-world environments

### 2. Vertical Slice Before Full Game

The first playable version must be small:

- one player
- one tiny region
- three starter companions
- one NPC rival
- one battle
- timed attacks
- awakening meter
- win/loss
- XP reward

If this is not fun, the larger game will not work.

### 3. Mechanics Before Assets

For every asset, answer:

- What system uses this asset?
- What does the player do with it?
- What code event does it trigger?
- Is it required for the vertical slice or later?

### 4. Server-Authoritative Battle Rules

The browser cannot decide final battle results.

The client may:
- display animations
- run timing input
- submit chosen move
- submit timing grade

The server must:
- validate the battle state
- validate move legality
- cap timing bonus
- calculate damage
- apply status effects
- update HP
- update Awakening meter
- save battle state

## Required Master Lists

### A. Mechanics Master List

Must define:
- movement system
- map interaction system
- region unlock system
- party system
- recruitable companion system
- HP/stat system
- move system
- Strain Addition timing system
- Pheno Awakening system
- item/inventory system
- tool-gated progression system
- NPC/dialogue system
- battle reward system
- leveling system
- save/load system

### B. Asset Master List

Must define:
- player sprites
- NPC sprites
- strain companion portraits
- battle sprites or cards
- awakened form art
- move icons
- attack effect animations
- item icons
- tool icons
- inventory UI
- battle UI
- region tilemaps
- region tilesets
- obstacle sprites
- reward screen UI
- sound effects
- music loops

### C. Interaction Master List

Must define:
- walking into a tile
- colliding with obstacle
- pressing interact on NPC
- pressing interact on item
- starting a battle
- selecting a move
- timing a Strain Addition
- receiving damage
- activating Awakening
- using an item
- winning battle
- leveling up
- unlocking region/tool

## Build Order

### Phase 1 — Documentation Lock

Create:
- CORE_GAME_SYSTEMS.md
- ASSET_MANIFEST.md
- INTERACTION_MATRIX.md
- DATABASE_SCHEMA.md
- API_ROUTE_PLAN.md

### Phase 2 — Repo Scaffold

Create:
- Next.js web app
- Express API app
- Prisma schema
- shared battle types
- seed data

### Phase 3 — Battle Engine

Build:
- create battle
- get battle state
- submit move
- validate turn
- calculate damage
- NPC response turn
- battle log
- win/loss
- XP reward

### Phase 4 — Battle UI

Build:
- party panel
- enemy panel
- HP bars
- move buttons
- timing mini-game
- Awakening meter
- battle log
- result screen

### Phase 5 — Tiny Region

Build:
- one Phaser region
- movement
- collision
- NPC interaction
- item pickup
- battle trigger

### Phase 6 — Asset Replacement

Start with placeholders first. Replace with branded assets after mechanics work.

### Phase 7 — Website Deployment

Target route:

/games/pheno-quest

Deployment options:

1. Same VPS hosts frontend, API, and PostgreSQL.
2. Existing website embeds the game frontend and API runs separately.
3. Vercel hosts frontend, VPS or Supabase hosts backend/database.

Best likely option:
- frontend on existing website or Vercel
- API on VPS
- PostgreSQL on VPS or Supabase

## Definition of Finished for Vertical Slice

The vertical slice is finished when:

- player can load the game
- player can walk in one region or open battle directly
- player can start rival battle
- player can select moves
- timing input affects server-capped damage
- HP updates correctly
- enemy takes turns
- Awakening meter fills
- Awakening can activate
- battle ends
- XP/reward screen appears
- progress saves
- build deploys to website route

## Rule For Future Work

No new feature gets added unless it has:

1. mechanic definition
2. required assets
3. database/state need
4. API interaction
5. UI interaction
6. vertical-slice priority status
