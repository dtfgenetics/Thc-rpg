# Equipment Progression

## Purpose

Equipment turns room control precision into RPG progression. The environment model remains responsible for room state; equipment determines how finely a player can adjust that state through normal gameplay controls.

These are game mechanics, not real-world cultivation specifications.

## Slots

The first loadout has three slots:

- `lighting`
- `climate`
- `monitoring`

Each new game and migrated pre-v5 save receives starter equipment in every slot.

## Ownership and equipping

`Equipment` keeps two distinct concepts:

- `owned`: every valid equipment ID the player owns
- `equipped`: one equipment ID per slot

Buying an upgrade grants it and auto-equips it. Owned equipment can later be re-equipped without paying again.

Unknown IDs and slot mismatches are discarded during load so corrupted or stale save data cannot create invalid gear.

## Economy

`Game.purchaseEquipment(id)` is transactional:

1. Validate the equipment definition.
2. Reject items already owned.
3. Validate price and available player money.
4. Grant/equip the item.
5. Deduct currency only after the grant succeeds.

`player.money` remains the single authoritative currency source.

## Control precision

Starter gear uses coarse room-control increments. Upgrades provide smaller increments through `controlSteps`.

The game queries precision with `getEnvironmentControlStep(field)` and applies it through `nudgeEnvironment(field, direction)`, where direction must be `-1` or `1`.

This creates progression without altering static genetics or directly buffing plant stats.

## Save compatibility

Save format v5 adds an `equipment` object containing owned and equipped state. Save versions 1–4 continue to load and receive starter equipment without charging the player.
