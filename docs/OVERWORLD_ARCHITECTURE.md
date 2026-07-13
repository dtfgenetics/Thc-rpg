# Overworld architecture

## Simulation owns

- Player action state and legal state transitions
- Movement intent, speed, energy, and facing
- Quest flags, inventory, objectives, and saveable progress
- Interaction target selection
- Future creature, encounter, party, and quest rules

## Phaser owns

- Physics bodies and collision callbacks
- Sprite and environment rendering
- Camera following, shake, flash, particles, and tweens
- Procedural visual feedback
- Translation of simulation state into visible animation

## DOM owns

- Objective display
- Status, energy, seed count, and sound control
- Interaction prompts and dialogue toasts
- Touch controls
- Future menus, journal, PhenoDex, inventory, settings, and accessibility surfaces

## Action-state contract

`idle → walk/dash/interact/hurt/celebrate`

Temporary reaction states lock movement for a defined interval. Hurt can interrupt other states. Movement state is derived from current input after locks expire.

## Extension points

- Add `observe`, `capture`, and field-ability actions to the input map.
- Replace quest switch logic with data-driven quest nodes and conditions.
- Store checkpoint position separately from per-frame renderer coordinates.
- Add encounter triggers that dispatch an encounter request rather than directly starting battles in the scene.
- Replace procedural tones with licensed, normalized audio assets while preserving the same audio API.
