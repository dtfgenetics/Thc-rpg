# Region Map State Implementation

## Purpose

Grower’s Grove needs to remember what Seed Man has already done so the map does not behave like a reset-only test scene.

This system gives the frontend a single region state response that explains which objects should be visible, cleared, active, claimed, or recruited.

## New RPG Kernel File

```text
packages/rpg-kernel/src/mapStateTypes.ts
```

Defines:

- `RegionMapStateView`
- `RegionItemStateView`
- `RegionObstacleStateView`
- `RegionSavePointStateView`
- `RegionQuestStateView`
- `RegionRecruitStateView`

## New Backend Service

```text
apps/api/src/services/mapStateEngine.ts
```

This service reads:

- inventory
- unlock flags
- obstacles
- save points
- save point visits
- active save state
- quest state
- recruitment state

Then it builds a region-specific response.

## New API Route

```text
GET /regions/:regionSlug/state/:playerId
```

Example:

```text
GET /regions/growers-grove/state/player_id
```

## Item Pickup Visibility

Item pickups now write an unlock flag:

```text
pickup:item-slug
```

Example:

```text
pickup:grinder-relic
```

This matters because stackable consumables like Terp Tonic can be used up later. The map still needs to know that the field pickup was already collected, even if the item is no longer in inventory.

## Grower’s Grove Integration

Grower’s Grove now loads region state before creating the Phaser scene.

The map uses region state to decide whether to draw or allow interaction with:

- Terp Tonic
- Grinder Relic
- Vapor Lens
- Brittle Resin Wall
- Hidden Smoke Path

After an interaction runs, Grower’s Grove refreshes the region state so the next interaction check uses updated data.

## Live Object Registry

Grower’s Grove now keeps a Phaser object registry:

```text
objectSlug → Phaser GameObjects[]
```

When region state refreshes, the scene checks each registered object. If the server says the object is no longer visible, the scene destroys the registered Phaser objects and removes them from the registry.

This means items and obstacles can disappear immediately after being collected or cleared.

## Current Behavior

On reload:

```text
Collected items do not redraw.
Cleared obstacles do not redraw.
Collected or cleared objects are removed from interaction targeting.
Cure Station remains available.
NPCs remain available.
```

During live play:

```text
Collected items are destroyed after pickup.
Cleared obstacles are destroyed after tool use.
Destroyed objects are removed from future interaction targeting.
```

## Known Limitation

This is still a first-pass object registry. It handles static pickups and obstacles, but it does not yet animate disappear effects, play pickup sounds, or support respawning timed resources.

## Next Upgrade

Add a region entity manifest so object positions and draw behavior do not live directly inside `GrowersGroveGame.tsx`.

Suggested file:

```text
apps/web/app/games/pheno-quest/grove/growersGroveManifest.ts
```

That manifest should define:

- item positions
- obstacle positions
- NPC positions
- save point positions
- battle trigger positions
- region exits
