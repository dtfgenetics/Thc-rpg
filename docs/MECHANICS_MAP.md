# THC: Pheno Quest — Mechanics Map

## Purpose

This document identifies every mechanic that must exist for the vertical playable slice and separates it from later systems so the build does not drift.

## Core Design Pillar

The game is a cannabis fantasy RPG where strain companions battle through server-authoritative turns. The core fun must come from combat decisions, timed Strain Addition inputs, and Pheno Awakening transformations.

## Mechanics Required for Vertical Playable Slice 1

### 1. Player Session / Test Player

Build a simple development player flow first. Full auth can come later.

Required:
- Create or load a dev player
- Store player ID
- Assign starter party
- Track XP and rewards

Not required yet:
- OAuth
- Email login
- Password reset
- user profiles

### 2. Strain Companion Templates

These are the base species/templates.

Required fields:
- name
- primary type
- secondary type
- role
- base HP
- potency
- vigor
- speed
- resin
- terpenes
- stability
- awakening name
- starter flag

Starter companions:
- Blue Mango — Hybrid / Fruit — balanced attacker-support
- Sour Diesel — Sativa / Gas — fast striker
- Granddaddy Purple — Indica / Purple — tank/debuffer

### 3. Player Companions

A player-owned instance of a strain template.

Required:
- level
- XP
- current HP during battle
- owner
- template

Later:
- IVs / pheno variance
- nicknames
- rarity mutations
- breeding lineage

### 4. Party System

Required:
- 3 active companions maximum for the slice
- first living companion acts during battle
- party is loaded into battle state

Later:
- bench slots
- swap actions
- equipment
- formation bonuses

### 5. Move Templates

Required:
- name
- type
- target
- base power
- accuracy
- meter gain
- timing pattern
- good bonus cap
- perfect bonus cap
- optional status effect
- awakening-only flag

First moves:
- Mango Rush
- Resin Guard
- Diesel Flash
- Purple Lock
- Basic Strike

### 6. Battle State

Required:
- battle ID
- player ID
- NPC ID
- status: ACTIVE, WON, LOST
- turn number
- player combatants snapshot
- enemy combatants snapshot
- active combatant references
- battle log

Important:
Battle state must be saved server-side. The browser may render state but cannot own it.

### 7. Server-Side Turn Validation

Required validation:
- battle exists
- battle is active
- acting companion belongs to current player state
- selected move exists
- selected move is legal for companion
- target is alive
- timing result is capped and sanitized

### 8. Strain Addition Timing

Client responsibility:
- run timing mini-game
- submit timing grade and hit count

Server responsibility:
- cap bonus
- calculate damage
- update state
- write battle log

Timing grades:
- MISS: no bonus
- GOOD: smaller capped bonus
- PERFECT: larger capped bonus

### 9. Damage Calculation

Required:
- base power
- attacker potency
- defender vigor
- type modifier
- timing bonus
- minimum damage floor
- HP reduction

Not required yet:
- full elemental chart
- critical hits
- random variance
- deep status stack rules

### 10. Pheno Awakening

Required:
- meter starts at 0
- meter increases from moves
- at 100, player can activate Awakening
- Awakening lasts 3 turns
- awakened companion receives stat/move bonus

### 11. Enemy AI

Required:
- NPC chooses a legal move
- NPC attacks player active companion
- simple deterministic priority is fine

Later:
- difficulty personalities
- region boss scripts
- smart targeting

### 12. Win / Loss / Rewards

Required:
- battle ends when one side has no living companions
- win gives XP and Kush Coin or Reputation
- loss records defeat but does not delete player progress
- frontend shows result screen

## Mechanics Not Built in Vertical Slice 1

These are important later, but banned from the first slice:

- breeding
- trading
- marketplace
- async PvP
- guilds
- territory
- full overworld
- multi-region map
- cosmetics
- live chat
- real-time rooms
- push notifications

## Later Expansion Mechanics

### Exploration

Small Phaser regions with tool-gated obstacles.

Example tools:
- Grinder Relic
- Vapor Lens
- Trimmer Blade
- pH Crystal
- Terp Torch

### Breeding / Pheno Hunting

Later build:
- parent genetics
- inherited stats
- mutation chance
- keeper score
- pheno rarity

### Async Multiplayer

Later build:
- saved party snapshots
- leaderboard
- async rival battles
- strain trading

## Build Order

1. Shared battle types
2. Prisma schema
3. seed data
4. battle engine unit tests
5. Express API routes
6. simple Next.js battle UI
7. local test battle
8. deployment wiring
