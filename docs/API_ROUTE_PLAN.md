# API Route Plan — Vertical Playable Slice 1

## Implemented Routes

### `GET /health`

Returns API status.

Response:

```json
{ "status": "ok" }
```

### `POST /dev/player`

Creates or loads a development player and assigns the three starter companions if the player has no party.

Body:

```json
{ "handle": "DTF Demo Grower" }
```

### `GET /players/:playerId`

Returns player summary and active party.

### `POST /battles/start`

Starts the first NPC rival battle.

Body:

```json
{
  "playerId": "player_id",
  "npcSlug": "rival-grower-ashtray"
}
```

### `GET /battles/:battleId`

Loads the full saved battle state.

### `POST /battles/:battleId/turn`

Resolves one player turn and one automatic enemy response turn.

Body:

```json
{
  "playerId": "player_id",
  "actorId": "player_companion_id",
  "targetId": "enemy-combatant-id",
  "moveSlug": "mango-rush",
  "timing": {
    "grade": "GOOD",
    "hitCount": 2
  }
}
```

Server responsibilities:
- validate battle ownership
- validate battle is active
- validate actor is alive
- validate target is alive
- validate move is legal
- sanitize timing input
- cap timing bonus
- calculate damage
- update HP/shield/status/meter
- resolve NPC response
- check win/loss
- save state

### `POST /battles/:battleId/awaken`

Activates Pheno Awakening for a player combatant.

Body:

```json
{
  "playerId": "player_id",
  "actorId": "player_companion_id"
}
```

Server responsibilities:
- meter must be at least 100
- companion must be alive
- battle must be active
- sets transformation for 3 turns
- resets meter to 0
- saves battle state

## Routes Not Built Yet

These are later systems:

- `GET /inventory/:playerId`
- `POST /inventory/use`
- `GET /regions/:regionSlug`
- `POST /map/interact`
- `POST /companions/recruit`
- `POST /party/swap`
- `POST /quests/complete`
- `POST /breeding/start`
- `GET /leaderboard`

## Security Rule

The client may request actions. The server decides whether they are legal.

No final battle result, reward, XP value, or unlock should ever be trusted from the browser.
