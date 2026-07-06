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

## Current Behavior

On reload:

```text
Collected items do not redraw.
Cleared obstacles do not redraw.
Collected or cleared objects are removed from interaction targeting.
Cure Station remains available.
NPCs remain available.
```

## Known Limitation

In this first version, objects drawn before an action may remain visible until reload because the scene does not yet destroy already-created game objects after a state refresh.

However, interaction targeting updates immediately after state refresh, so the player should not be able to re-use collected/cleared objects.

## Next Upgrade

Add Phaser object registry/destruction:

```text
objectSlug → Phaser GameObjects
```

Then, after region state refresh:

```text
if object.visible === false → destroy its Phaser objects
```

This will make the map visually update immediately without requiring a reload.
