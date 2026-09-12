# THC RPG — The First Seed

A browser-based cultivation RPG vertical slice for the DTF game hub.

## Status

**Playable release-candidate vertical slice in active development.**

The 2.1 campaign expands the original three-chapter grow loop into six connected chapters and makes Keeper selection a required progression mechanic rather than a detached journal feature.

## Current campaign

1. **The First Seed** — begin the grow loop and establish the first Blue Mango plant.
2. **Dial It In** — learn environmental control and upgrade the grow room.
3. **Phenotype Hunt** — work through Mango Bubbles phenotype variation and quality selection.
4. **Keeper Standard** — mark a Mango Bubbles harvest as a Keeper and preserve cutting stock from that exact phenotype.
5. **Clone Proof** — replant the exact Keeper phenotype, hold a stable room, and prove it with another high-quality harvest.
6. **Zestberry Trial** — unlock Zestberry, build the full advanced room, maintain control, and finish the first post-selection genetics trial.

## Current systems

- Vanilla JavaScript ES-module browser runtime
- Blue Mango, Blue Bubblegum, Mango Bubbles, and unlockable Zestberry genetics with deterministic phenotype variation
- Plant growth, hydration, stress, health, yield, quality, resilience, and environment-response simulation
- Equipment-driven grow-room controls for temperature, humidity, light, pH, and EC
- Equipment purchasing/equipping with progression-based control precision
- Six-chapter quest chain with prerequisites, objective tracking, one-time rewards, genetics unlocks, and advanced-room requirements
- Inventory, XP, levels, currency, harvesting, NPC dialog, and location travel
- Persistent **Pheno Grow Journal** records for every harvest, including phenotype seed, traits, yield, quality, room score, vigor, resilience, and flowering expression
- Keeper marking that now records campaign progress when the correct genetics are selected
- **Keeper cutting propagation:** marked Keepers can maintain preserved cutting stock and replant a cutting using the exact saved phenotype seed
- Quest reconstruction for existing Keeper/cutting stock so a player does not lose credit simply because the new chapter starts after selection work was already performed
- Local save/load with backward-compatible version 1 → version 6 migration; campaign expansion remains additive within the existing v6 save schema
- Responsive mobile controls, keyboard shortcuts, reduced-motion support, and accessible dialogs
- Core engine regression tests plus deterministic shipped-UI validation
- Route-safe production artifact contract for `/games/thc-rpg/`

The preserved-cutting mechanic is explicitly a game abstraction: marking a Keeper represents stock preserved before harvest rather than implying that harvested plant material can later be cloned.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Test and release validation

```bash
npm test
npm run validate:ui
npm run build
npm run validate:release
```

`npm run validate:ui` checks the shipped browser contract directly: mobile safe-area behavior, 44px action targets, compact layouts, accessible modal surfaces, keyboard shortcut guards, reduced-motion behavior, save/load wiring, and the machine-readable release gate.

`npm run build` creates a self-contained `dist/` containing only the visitor runtime. CI validates that bundle and uploads it as `thc-rpg-production-build`.

The machine-readable release contract is `public/game-release.json`. Each new canonical revision must pass standalone engine tests, deterministic shipped-UI validation, route-safe build validation, central DTFSeeds packaging, and exact live-route verification before the DTFSeeds source pin advances.

## Structure

```text
public/
└── game-release.json

scripts/
├── build-release.mjs
├── validate-ui-contract.mjs
└── validate-release.mjs

src/
├── data/game-data.json
├── game/
│   ├── CampaignChapters.js
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

tests/
├── game.test.js
├── grow-journal.test.js
├── keeper-campaign.test.js
└── keeper-cuttings.test.js
```

## Deployment model

This project is intentionally framework-free and can be served as static files. Asset and data URLs are relative so the game can live under `/games/thc-rpg/` rather than requiring the domain root. Production integration should rebuild the exact verified canonical revision or consume its green `thc-rpg-production-build`; it should never hand-copy an unverified source snapshot.

## Next gameplay expansion areas

After the 2.1 campaign is stable, the next high-value gameplay work is deeper location progression, breeding/lineage decisions that consume proven Keeper history, additional genetics trials, equipment tradeoffs, stronger NPC chapter-specific dialog, and richer production art/audio feedback without breaking save compatibility.
