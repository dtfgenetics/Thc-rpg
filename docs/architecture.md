# Architecture Guardrails

- Vanilla JavaScript ES modules; no framework build step.
- Static definitions stay in game-data.json; runtime player state stays in saves.
- player.money is the only currency source.
- Plant saves store geneticsId rather than duplicating genetics definitions.
- Save migrations must remain explicit and tested.
- Browser paths remain relative for /games/thc-rpg/ deployment.
