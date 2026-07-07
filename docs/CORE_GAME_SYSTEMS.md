# THC: Pheno Quest — Core Game Systems

## Game Identity

THC: Pheno Quest is a cannabis fantasy RPG mashup built from three proven design pillars:

- Zelda: movement, maps, puzzles, exploration, key tools, locked paths
- Final Fantasy: party structure, HP, stats, turns, XP, items, bosses
- Legend of Dragoon: timed attacks and temporary transformation states

Cannabis identity appears through strain companions, pheno awakenings, terpene/status mechanics, genetics, grow-world environments, and cultivation-themed tools.

## System 1 — Player System

Purpose:
The player owns companions, inventory, progress, battles, region unlocks, and rewards.

V1:
- dev player creation
- player handle
- Kush Coin
- reputation
- starter party

Later:
- real account auth
- profile
- save slots
- achievements

## System 2 — Recruitable Companion System

Purpose:
Strain companions act as party members.

Each companion needs:
- base template
- player-owned instance
- level
- XP
- type
- role
- stats
- moves
- awakening form

Starter companions:
- Blue Mango
- Sour Diesel
- Granddaddy Purple

Later recruitment sources:
- quest rewards
- rare encounters
- rival battles
- region bosses
- breeding
- limited events

## System 3 — Party System

Purpose:
The player selects active companions for combat and exploration bonuses.

V1:
- three active slots
- first living companion acts

Later:
- swap actions
- bench slots
- formation bonuses
- party passives

## System 4 — HP and Stats System

Core stats:
- HP: health
- Potency: attack power
- Vigor: defense
- Speed: turn speed / initiative later
- Resin: shield / special defense
- Terpenes: status effect strength
- Stability: status resistance

V1:
- HP updates in battle
- damage uses potency vs vigor
- shield uses resin
- status checks use terpenes vs stability

## System 5 — Turn-Based Battle System

Purpose:
Combat resolves as server-authoritative turns.

Flow:
1. Player selects move
2. Client runs Strain Addition timing
3. Client submits move and timing result
4. Server validates state
5. Server caps timing bonus
6. Server calculates damage/effects
7. Server updates battle state
8. NPC responds
9. Server checks win/loss

Rule:
The browser never decides final damage, XP, rewards, or unlocks.

## System 6 — Strain Addition Timing System

Purpose:
Adds skill to turn-based combat without real-time multiplayer infrastructure.

V1 grades:
- MISS: no bonus
- GOOD: small capped bonus
- PERFECT: larger capped bonus

The client can measure timing. The server sanitizes and caps it.

## System 7 — Pheno Awakening System

Purpose:
Temporary transformation state similar to a dramatic RPG power mode.

V1:
- meter builds through moves
- at 100 meter, companion can awaken
- awakening lasts 3 turns
- awakened companion deals increased damage

Later:
- awakened-only moves
- changed art
- changed passive
- special finisher

## System 8 — Move and Ability System

Each move needs:
- slug
- name
- type
- kind
- base power
- accuracy
- meter gain
- timing pattern
- bonus caps
- status effect
- cooldown
- awakening-only flag

Move kinds in V1:
- DAMAGE
- SHIELD
- DEBUFF

Later:
- HEAL
- CLEANSE
- SUMMON
- FIELD
- COUNTER

## System 9 — Item and Inventory System

Purpose:
Stores usable objects, key tools, quest items, and later genetics.

V1:
Not built yet.

Required later categories:
- consumables
- battle items
- key tools
- relics
- seeds/genetics
- quest items
- upgrade materials

## System 10 — Zelda-Style Movement and Map System

Purpose:
Small tile-based regions with exploration and tool-gated progress.

V1:
Not built yet.

Required later:
- player movement
- tile collision
- interact button
- NPC dialogue
- item pickup
- obstacle check
- region transition
- battle trigger

Recommended implementation:
Phaser tilemap after battle prototype works.

## System 11 — Tool-Gated Exploration System

Purpose:
Cultivation-themed tools unlock paths and regions.

Example tools:
- Grinder Relic: breaks brittle resin walls
- Vapor Lens: reveals smoke-hidden paths
- Trimmer Blade: cuts overgrown vines
- pH Crystal: purifies toxic soil
- Terp Torch: lights grow chambers
- Clone Dome: revives rare genetics

## System 12 — Environment Ecosystem System

Purpose:
Regions should feel like cannabis fantasy ecosystems, not generic maps.

Example regions:
- Grower’s Grove
- Sativa Summit
- Indica Valley
- Kief Caves
- Terpene Forest
- Resin Ruins

Each region later needs:
- tileset
- local enemies
- local recruitable companions
- item/tool gate
- NPC rival or boss
- environmental puzzle

## System 13 — Leveling and Progression System

V1:
- companions earn XP
- companions can level
- player earns Kush Coin and reputation

Later:
- move unlocks by level
- region unlocks
- boss badges
- companion evolution/awakening upgrades
- breeding mastery

## System 14 — Save and Persistence System

V1:
- player saved in database
- companions saved in database
- active battle saved in database
- rewards saved after win/loss

Later:
- map state
- inventory
- quests
- region unlocks
- defeated bosses
- recruitment flags

## System 15 — Website Integration System

Target route:

```text
/games/pheno-quest
```

Recommended production shape:
- Next.js frontend
- Express API
- PostgreSQL database
- VPS or managed database
- Nginx/reverse proxy if hosted on VPS

## Build Priority

1. Battle engine
2. Battle UI
3. Rewards and save loop
4. Inventory
5. Tiny map
6. Recruitment
7. Region ecosystem
8. More companions
9. Breeding
10. Async multiplayer
