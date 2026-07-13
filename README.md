# THC: The Emerald Frontier — Overworld Foundation

This branch establishes the first playable foundation for the THC monster-catching cultivation RPG. It is deliberately focused on the overworld loop before combat, breeding, or online systems are added.

## Working features

- Top-down eight-direction movement with normalized diagonal speed
- Keyboard, arrow-key, and touch controls
- Dash state with energy drain and recovery
- Explicit player state machine: idle, walk, dash, interact, hurt, celebrate
- World collision, camera follow, world bounds, and environmental hazard reactions
- Context-sensitive interaction targeting and prompts
- Seed Man NPC dialogue and objective progression
- Collectible Glow Seed and research-shrine quest completion
- Procedural idle, walk, dash, interact, hurt, and celebration animation feedback
- Footstep, interaction, denial, pickup, hurt, and celebration reaction sounds using Web Audio
- Particle bursts, emotes, camera shake, flash feedback, zone announcements, and toast dialogue
- Local autosave for objectives, flags, inventory, seed count, and energy
- Responsive HUD and mobile controls
- Pure-system tests for movement, state transitions, interaction selection, and quest state

## Run locally

Use a local web server because browser modules do not run correctly from a `file://` URL.

```bash
npm test
npm run check
npm run serve
```

Then open `http://localhost:4173`.

## Controls

- Move: WASD or arrow keys
- Dash: Shift
- Interact: E or Space
- Mute: M or the HUD sound button
- Mobile: on-screen directional and action buttons
- Debug physics: add `?debug` to the URL

## Architecture boundary

Serializable game rules live outside Phaser scenes. Phaser owns rendering, camera, physics, tweens, and effects. Text-heavy HUD elements remain in the DOM. This is the required boundary for adding combat, quests, saves, creatures, and multiplayer without turning one scene into an unmaintainable global state container.

## Next production systems

1. Replace generated placeholder characters with approved normalized sprite sheets.
2. Add tilemap-authored environments and collision layers.
3. Add a Pheno entity system with overworld behavior, observation, and encounter transitions.
4. Add a quest graph rather than hard-coded quest flags.
5. Add save migrations and position/checkpoint persistence.
6. Add battle-scene transition and party state.
7. Add Playwright screenshots and mobile visual regression testing.
