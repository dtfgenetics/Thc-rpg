# THC RPG — The First Seed

A browser-based cultivation RPG vertical slice for the DTF game hub.

## Status

**Playable vertical slice in active development.**

The current build includes:

- Vanilla JavaScript ES-module browser runtime
- Blue Mango and Blue Bubblegum genetics data
- Plant growth, hydration, stress, health, yield, and quality simulation
- The First Seed quest with objective tracking and one-time rewards
- Inventory, XP, levels, currency, harvesting, NPC dialog, and location travel
- Local save/load with version 1 → version 2 migration
- Responsive mobile controls and accessible dialogs
- Regression tests for the core game engine

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Test

```bash
npm test
```

## Structure

```text
src/
├── data/game-data.json
├── game/
│   ├── Game.js
│   ├── Plant.js
│   └── Inventory.js
├── main.js
└── styles.css

tests/
└── game.test.js
```

## Deployment model

This project is intentionally framework-free and can be served as static files. Asset and data URLs are relative so the game can live under a route such as `/games/thc-rpg/` rather than requiring the domain root.

## Current production milestone

Finish browser QA for the vertical slice, then expand the simulation with phenotype variation, equipment/environment systems, additional quests, and production art without breaking save compatibility.
