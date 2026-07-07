# Progression System Implementation

## Purpose

This file documents the first RPG progression layer for THC: Pheno Quest. The goal is to connect Seed Man's overworld actions to dialogue, quests, rewards, and recruitable companions.

## New Systems Added

### Dialogue

Dialogue templates allow Seed Man to talk to cannabis-parody NPCs.

Implemented seed dialogue:

- `garden-keeper-intro` — Garden Keeper Nugsworth gives Seed Man the first Grove quest.
- `rival-ashtray-challenge` — Rival Grower Ashtray challenges Seed Man.

### Quests

Quest templates define chapter goals, steps, and rewards.

Implemented first quest:

```text
clear-resin-wall
```

Visible name:

```text
Clear the Resin Wall
```

Steps:

1. Talk to Garden Keeper Nugsworth.
2. Pick up the Grinder Relic.
3. Use Grinder Relic on Brittle Resin Wall.
4. Return to Garden Keeper Nugsworth.

Rewards:

- Kush Coin
- Reputation
- unlock flag
- Skunk Scout recruitment event

### Recruitment

Recruit events let Seed Man gain new strain companions after conditions are met.

Implemented first recruit event:

```text
recruit-skunk-scout
```

Requirement:

```text
Quest clear-resin-wall must be claimed.
```

Reward:

```text
Skunk Scout joins Seed Man's crew.
```

## New Database Models

- `DialogueTemplate`
- `QuestTemplate`
- `PlayerQuest`
- `RecruitEvent`
- `PlayerRecruitClaim`

## New RPG Kernel Types

- `dialogueTypes.ts`
- `questTypes.ts`
- `recruitmentTypes.ts`

## New API Routes

### Dialogue

```text
GET /dialogue/:dialogueSlug
```

### Quests

```text
GET  /quests/:playerId
POST /quests/start
POST /quests/advance
POST /quests/claim
```

### Recruitment

```text
GET  /recruitment/:playerId
POST /recruitment/recruit
```

## First Chapter Flow

```text
Seed Man enters Grower's Grove
→ talks to Garden Keeper Nugsworth
→ quest starts
→ Seed Man picks up Grinder Relic
→ quest advances
→ Seed Man clears Brittle Resin Wall
→ quest advances
→ Seed Man returns to Garden Keeper
→ quest completes
→ quest reward is claimed
→ Skunk Scout can join Seed Man's crew
```

## Why This Matters

The game now has a real RPG loop:

```text
explore
→ talk
→ receive objective
→ use item/tool
→ complete quest
→ claim reward
→ recruit companion
```

This connects the Zelda-style map layer with the Final Fantasy-style party layer and the cannabis parody identity.

## Next Required Upgrade

Add a party roster screen so players can see recruited companions and swap party slots.

Required next API routes:

```text
GET /party/:playerId
POST /party/swap
POST /party/add
POST /party/remove
```
