# THC RPG — The First Seed

A browser-based cultivation RPG vertical slice for the DTF game hub.

## Status

**Playable release-candidate vertical slice in active development.**

The current build includes:

- Vanilla JavaScript ES-module browser runtime
- Blue Mango and Blue Bubblegum genetics data with deterministic phenotype variation
- Plant growth, hydration, stress, health, yield, quality, resilience, and environment-response simulation
- Equipment-driven grow-room controls for temperature, humidity, light, pH, and EC
- Equipment purchasing/equipping with progression-based control precision
- The First Seed quest chain with objective tracking and one-time rewards
- Inventory, XP, levels, currency, harvesting, NPC dialog, and location travel
- Persistent **Pheno Grow Journal** records for every harvest, including phenotype seed, traits, yield, quality, room score, vigor, resilience, and flowering expression
- Keeper marking so standout harvested phenotypes remain identified after harvest
- **Keeper cutting propagation:** marked Keepers can maintain preserved cutting stock and replant a cutting using the exact saved phenotype seed, creating a real selection payoff while explicitly treating the preserved cutting as a pre-harvest gameplay abstraction
- Local save/load with backward-compatible version 1 → version 6 migration; clone inventory is additive within the existing v6 schema
- Responsive mobile controls, keyboard shortcuts, reduced-motion support, and accessible dialogs
- Core engine regression tests plus desktop/mobile Playwright browser acceptance
- Route-safe production artifact contract for `/games/thc-rpg/`

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Test and release validation

```bash
npm test
npm run test:e2e
npm run build
npm run validate:release
```

`npm run build` creates a self-contained `dist/` containing only the visitor runtime. CI validates that bundle and uploads it as `thc-rpg-production-build`.

The machine-readable release contract is `public/game-release.json`. It intentionally remains `release-candidate`: central DTFSeeds packaging and exact live-route verification are still required before production-ready status.

## Structure

```text
public/
└── game-release.json

scripts/
├── build-release.mjs
└── validate-release.mjs

src/
├── data/game-data.json
├── game/
│   ├── Environment.js
│   ├── Equipment.js
│   ├── Game.js
│   ├── GrowJournal.js
│   ├── Inventory.js
│   ├── KeeperCuttings.js
│   ├── Phenotype.js
│   ├── Plant.js
│   └── SaveStore.js
├── autosave.js
├── grow-journal-ui.js
├── main.js
└── styles.css

e2e/
├── keeper-cuttings.spec.js
└── smoke.spec.js

tests/
├── game.test.js
├── grow-journal.test.js
└── keeper-cuttings.test.js
```

## Deployment model

This project is intentionally framework-free and can be served as static files. Asset and data URLs are relative so the game can live under `/games/thc-rpg/` rather than requiring the domain root. Production integration should consume the exact green `thc-rpg-production-build` artifact or rebuild the exact verified canonical revision; it should not hand-copy an unverified source snapshot.

## Current production milestone

Land the standalone artifact contract, pin the exact green revision in central THC, package it through the DTFSeeds public suite, and verify the live route. Gameplay development can then continue with breeding/lineage decisions, additional quests and locations, stronger production art, and deeper browser/mobile QA without breaking save compatibility.
