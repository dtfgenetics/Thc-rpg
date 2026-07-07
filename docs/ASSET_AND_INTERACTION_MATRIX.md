# THC: Pheno Quest — Asset and Interaction Matrix

## Purpose

This file connects every asset category to the mechanic and code interaction that uses it. If an asset does not have a gameplay purpose, it should not be prioritized before the vertical slice works.

## Core Asset Categories

| Asset Category | Used By System | Player Interaction | Code Interaction | Priority |
|---|---|---|---|---|
| Player overworld sprite | Movement / map | Move around region | position update, collision check | Slice 2 |
| Region tileset | Map system | Walk/explore | tile collision, trigger zones | Slice 2 |
| NPC sprite | Dialogue / battle trigger | Talk/interact | dialogue event or battle start | Slice 2 |
| Strain portrait | Party / battle UI | Select/view companion | loads companion data | Slice 1 |
| Battle card/sprite | Battle UI | View active fighter | render HP/status/meter | Slice 1 |
| Awakened form art | Pheno Awakening | Activate transformation | state changes to awakened | Slice 1 |
| Move icon | Battle menu | Choose move | submit move ID to API | Slice 1 |
| Attack effect | Combat feedback | Watch action result | display battle log animation | Slice 1.5 |
| HP bar | Battle UI | Read health | render current HP / max HP | Slice 1 |
| Awakening meter | Battle UI | Decide when to transform | render meter, activate ability | Slice 1 |
| Timing UI | Strain Addition | Timed button press | submit timing grade | Slice 1 |
| Item icon | Inventory | Use item | submit item use action | Slice 2 |
| Tool icon | Zelda-style progression | Unlock obstacle | check required tool | Slice 2 |
| Obstacle sprite | Map gating | Block or unlock path | tool requirement check | Slice 2 |
| Reward screen | Battle rewards | Claim results | grant XP/currency/items | Slice 1 |
| Sound effects | Feedback | Hear actions | play local UI/audio cue | Slice 1.5 |
| Music loop | Atmosphere | Passive | local audio playback | Slice 2 |

## Required Vertical Slice 1 Assets

These can start as placeholders:

1. Blue Mango portrait
2. Sour Diesel portrait
3. Granddaddy Purple portrait
4. Enemy Skunk Scout portrait
5. Enemy Kush Bruiser portrait
6. Battle background
7. HP bar UI
8. Awakening meter UI
9. Move button UI
10. Timing mini-game UI
11. Battle log panel
12. Reward screen panel
13. Icons for Hybrid, Fruit, Sativa, Gas, Indica, Purple
14. Basic move icons
15. Placeholder hit effect

## Required Vertical Slice 2 Assets

After combat works:

1. Player overworld sprite
2. Grower’s Grove tileset
3. Home Grow Lab tileset pieces
4. Rival NPC sprite
5. Item pickup sprite
6. Obstacle sprite
7. Tool icon
8. Region transition marker
9. Dialogue box UI
10. Save point marker

## Interaction Rules

### Selecting a Move

Asset: move button/icon

Code:
- user selects move
- frontend checks battle is active
- frontend starts timing mini-game
- API receives move ID and timing result
- server validates and resolves

### Timing a Strain Addition

Asset: timing ring/bar/button

Code:
- frontend records grade only
- server caps accepted grade
- server calculates final damage

### Activating Pheno Awakening

Asset: Awakening meter and awakened form art

Code:
- meter must be 100
- API validates activation
- companion enters awakened state for 3 turns
- UI swaps art and move bonuses

### Using a Tool on an Obstacle

Asset: obstacle sprite and tool icon

Code:
- player interacts with obstacle
- API or local state checks required tool
- if owned, obstacle state changes to cleared
- if not, message displays requirement

### Recruiting a Companion

Asset: companion portrait/card

Code:
- reward or event grants companion template
- server creates player-owned companion instance
- roster UI updates

## Asset Creation Rule

Create assets in this order:

1. Combat UI placeholders
2. Companion portraits
3. Move icons
4. Battle background
5. Overworld placeholders
6. Region tileset
7. NPC and object sprites
8. Final polished animations

Do not polish map assets before the battle engine is playable.
