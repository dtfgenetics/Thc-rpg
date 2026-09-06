# THC RPG — The First Seed

A browser-based cultivation RPG vertical slice for the DTF game hub.

## Status

**Playable vertical slice in active development.**

The current build includes:

- Vanilla JavaScript ES-module browser runtime
- Blue Mango and Blue Bubblegum genetics data with deterministic phenotype variation
- Plant growth, hydration, stress, health, yield, quality, resilience, and environment-response simulation
- Equipment-driven grow-room controls for temperature, humidity, light, pH, and EC
- Equipment purchasing/equipping with progression-based control precision
- The First Seed quest chain with objective tracking and one-time rewards
- Inventory, XP, levels, currency, harvesting, NPC dialog, and location travel
- Persistent **Pheno Grow Journal** records for every harvest, including phenotype seed, traits, yield, quality, room score, vigor, resilience, and flowering expression
- Keeper marking so standout harvested phenotypes remain identified for future clone/breeding systems
- Local save/load with backward-compatible version 1 → version 6 migration
- Responsive mobile controls, keyboard shortcuts, reduced-motion support, and accessible dialogs
- Core engine regression tests plus Playwright browser acceptance

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Test

```bash
npm test
npm run test:e2e
```

## Structure

```text
src/
├── data/game-data.json
├── game/
│   ├── Environment.js
│   ├── Equipment.js
│   ├── Game.js
│   ├── GrowJournal.js
│   ├── Inventory.js
│   ├── Phenotype.js
│   ├── Plant.js
│   └── SaveStore.js
├── autosave.js
├── grow-journal-ui.js
├── main.js
└── styles.css

e2e/
└── smoke.spec.js

tests/
├── game.test.js
└── grow-journal.test.js
```

## Deployment model

This project is intentionally framework-free and can be served as static files. Asset and data URLs are relative so the game can live under a route such as `/games/thc-rpg/` rather than requiring the domain root.

## Current production milestone

Use the persistent keeper/journal data to build the next cultivation-RPG loop: cloning and keeper selection, breeding/lineage decisions, additional quests and locations, stronger production art, and deeper browser/mobile QA without breaking save compatibility.
