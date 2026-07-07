# Grower’s Grove Actions

## Purpose

Grower’s Grove now separates map data from map behavior.

The manifest answers:

```text
What exists on the map?
```

The action resolver answers:

```text
What happens when Seed Man interacts with that object?
```

## Action Resolver File

```text
apps/web/app/games/pheno-quest/grove/growersGroveActions.ts
```

## Shared API Helper

API calls now use:

```text
apps/web/app/components/gameApi.ts
```

This avoids duplicating fetch/error-handling code inside map components.

## Current Action Routes

The action resolver currently maps:

```text
garden-keeper-intro → dialogue / quest start / quest advance / quest claim / recruit Skunk Scout
terp-tonic → inventory pickup
grinder-relic → inventory pickup + quest advance
vapor-lens → inventory pickup
resin-wall-grove → tool use + quest advance
smoke-path-grove → tool use
growers-grove-cure-station → save point use / party recovery
rival-grower-ashtray → temporary battle message
```

## Why This Is Better

Before this change, `GrowersGroveGame.tsx` mixed together:

- Phaser rendering
- object positions
- proximity targets
- API fetch helper
- item pickup logic
- quest logic
- tool-use logic
- save point logic
- recruitment logic

Now the responsibilities are cleaner:

```text
growersGroveManifest.ts → map object data
growersGroveActions.ts → interaction behavior
gameApi.ts → shared frontend API requests
GrowersGroveGame.tsx → Phaser rendering, movement, proximity, and state refresh
```

## Next Upgrade

The rival action is still a temporary message.

Next, it should become a real battle transition:

```text
interact with Rival Grower Ashtray
→ POST /battles/start
→ navigate to /games/pheno-quest?battleId=...
→ battle resolves
→ return to Grower’s Grove
```

That is the next major step toward making Grower’s Grove feel like a real chapter instead of separate prototype screens.
