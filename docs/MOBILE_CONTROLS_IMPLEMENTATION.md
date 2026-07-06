# Mobile Controls Implementation

## Purpose

THC: Pheno Quest is intended to run on the website, so Seed Man must be controllable without a keyboard.

## Implemented In This Pass

The Grower’s Grove prototype now supports touch controls in addition to keyboard controls.

## Route

```text
/games/pheno-quest/grove
```

## Controls Added

### Movement

A touch D-pad was added under the Phaser canvas.

Supported directions:

- Up
- Down
- Left
- Right

The mobile D-pad updates a shared input ref that the Phaser scene reads every frame.

This means movement now supports:

```text
Keyboard arrows
WASD
Touch D-pad
```

### Interact Button

A touch `Interact` button was added.

It triggers the same interaction system as:

```text
E
Space
```

The full interaction rule is now:

```text
Move Seed Man near object
→ press E, Space, or Interact
→ run object action
```

### Fullscreen Button

A `Fullscreen` button was added for the game canvas area.

The browser may block fullscreen in some environments, so the UI reports when fullscreen is unavailable or blocked.

## Why This Matters

The game is being built for a website audience. Mobile control support cannot be added at the very end because every UI and interaction choice must work on phones.

This pass makes the first playable route more realistic for mobile testing.

## Current Limitations

This is a simple button-based first version. It is not a polished joystick yet.

Remaining mobile work:

- analog-style touch joystick
- mobile battle layout
- mobile party screen polish
- mobile dialogue box layout
- persistent mute button
- mobile fullscreen behavior testing on iOS and Android
- prevent page scroll while touching controls

## Next Recommended Control Upgrade

Add a shared control abstraction so future maps can reuse the same input structure instead of each Phaser scene owning its own input logic.

Suggested file:

```text
apps/web/app/components/gameControls.ts
```

Suggested responsibilities:

- keyboard state
- touch direction state
- interact queue
- control reset
- reusable movement vector

This should happen before adding more maps.
