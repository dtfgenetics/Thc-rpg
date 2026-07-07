# Control Component Architecture

## Purpose

Seed Man needs controls that can be reused by every future web map, not only Grower's Grove.

## Current Component

```text
apps/web/app/components/GameTouchControls.tsx
```

This component provides the on-screen controls for the website build.

It exports:

```text
GameTouchControls
MobileDirection
MobileInputState
```

## Current Inputs Supported

Grower's Grove now supports:

```text
Arrow keys
WASD
On-screen direction buttons
E key
Space key
On-screen Interact button
Fullscreen button
```

## Current Wiring

Grower's Grove keeps the actual movement state in refs:

```text
mobileInputRef
mobileInteractRef
```

The Phaser scene reads the direction state every frame and checks the interact queue when Seed Man is close to an object.

## Why This Is Better

Before this change, the map component owned all control button markup directly.

Now the button layer is reusable, so future maps can import the same control component instead of copying code.

## Still Needed

The next structural step is a shared input helper:

```text
apps/web/app/components/gameInput.ts
```

That helper should:

- normalize keyboard and on-screen direction input into one movement vector
- expose a safe interact queue
- reset inputs on unmount
- prevent stuck movement states
- allow every Phaser map to share the same movement logic

## Rule Going Forward

Do not build a second region until movement and interaction input are reusable.

The order should be:

```text
1. GameTouchControls component
2. gameInput helper
3. Grower's Grove uses helper
4. Then future maps reuse the same control system
```
