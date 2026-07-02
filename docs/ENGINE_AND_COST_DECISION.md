# Engine and Cost Decision

## Goal

THC: Pheno Quest must be playable on the website and built without new paid infrastructure.

## Decision

Use the existing web stack:

```text
Next.js + TypeScript frontend
Express API backend
PostgreSQL + Prisma database
Phaser for the later Zelda-style overworld
```

Do not use Unreal Engine for the website build.

## Why Not Unreal Engine For This Version

Unreal is powerful, but it is the wrong tool for this specific target:

1. The game must be playable directly on the website.
2. The project must stay free to build and host.
3. The game is 2D / menu-heavy / RPG-system-heavy, not a high-end 3D game.
4. Unreal adds a large editor, large build pipeline, and licensing/distribution constraints.
5. Unreal Engine code is licensed technology and should not be copied into this public web repo.

## What We Can Use From Unreal

We can borrow design patterns, not code or proprietary assets.

Useful Unreal-style systems to recreate ourselves:

- component-based actors
- data-driven character templates
- data tables for moves/items/enemies
- state machines
- animation state names
- event dispatching
- tags for interactable objects
- save-game style state objects

## What We Should Not Use From Unreal

Do not use:

- Unreal Engine source code
- Unreal Starter Content
- MetaHuman assets
- Marketplace/Fab assets unless their license allows this exact usage
- Unreal editor tools in the web runtime

## Free Web-Friendly Alternatives

### Phaser

Best fit for the overworld.

Use for:
- tile maps
- player movement
- collisions
- NPC interaction zones
- item pickups
- region transitions
- simple 2D effects

### Plain React / Next.js

Best fit for menus and battles.

Use for:
- battle UI
- inventory
- companion roster
- dialogue boxes
- reward screens
- menus

### Express + PostgreSQL

Best fit for server-owned game state.

Use for:
- player saves
- battles
- inventory
- XP
- rewards
- unlocks
- anti-cheat validation

### Godot

Possible alternative, but not chosen for v1.

Godot can export to web, but adding it would split the codebase away from the current Next.js/Express repo. Use only if we later decide to make a standalone downloadable or embedded game build.

## Current Architecture

```text
Browser
  Next.js UI
  Phaser overworld later
  sends actions to API

API
  validates actions
  calculates battle results
  updates database

Database
  stores player, companions, battles, inventory, unlocks
```

## Zero-Spend Hosting Strategy

Preferred:

```text
Existing website or game subdomain hosts frontend
Existing VPS or free-tier backend hosts API
PostgreSQL runs on VPS or free-tier managed database
```

Avoid:
- always-on realtime rooms
- paid asset stores
- paid plugins
- paid game engine subscriptions
- large 3D streaming builds

## Build Rule

Every system must be web-first. If it cannot run cleanly in the browser and connect to the existing API/database, it waits.
