# Seed Man — Main Character Lock

## Decision

Seed Man is the main playable character for THC: Pheno Quest.

He is the player avatar used for:

- overworld movement
- NPC interaction
- item pickup
- tool use
- region exploration
- battle initiation
- story progression

Seed Man does not replace strain companions. He leads the party.

## Role In The Game

Seed Man is a young living seed hero from the THC / DTF universe. He explores cannabis-fantasy regions, recruits strain companions, restores lost genetics, and clears corrupted grow-world obstacles.

## Gameplay Function

Seed Man is the controllable overworld character.

Code systems using Seed Man:

- movement controller
- collision system
- interact button
- inventory pickup
- key-tool usage
- dialogue trigger
- battle trigger
- region transition
- save point activation

## Party Relationship

Seed Man is the trainer/hero figure.

Strain companions are the battle party:

- Blue Mango
- Sour Diesel
- Granddaddy Purple
- later recruitable strains

When a battle starts, Seed Man sends in strain companions rather than fighting directly in the first version.

## Visual Direction

Seed Man should look like the previously created DTF / THC mascot direction:

- anthropomorphic seed character
- friendly but adventurous
- vintage cartoon influence
- readable small silhouette
- cannabis fantasy/parody tone
- not a copy of any existing game mascot

## MVP Placeholder

Until final art is imported, use a generated placeholder sprite:

- oval seed body
- tiny leaf sprout
- simple eyes
- boots/gloves implied by colored pixels/shapes
- green/brown cannabis-fantasy palette

This lets us develop the movement and interaction systems before final art.

## Required Final Assets

### Overworld

- Seed Man idle down
- Seed Man walk down
- Seed Man walk up
- Seed Man walk left
- Seed Man walk right
- Seed Man interact pose
- Seed Man pickup pose

### Battle / UI

- Seed Man portrait
- Seed Man dialogue face
- Seed Man victory pose
- Seed Man worried/defeat pose

### Marketing Later

- Seed Man logo pose
- Seed Man with Blue Mango companion
- Seed Man holding Grinder Relic
- Seed Man explorer outfit

## Naming Rule

Use `seed-man` as the internal slug.

Use `Seed Man` as the visible character name unless a later branding pass renames him.

## Implementation Rule

Any overworld code should refer to the player sprite/entity as Seed Man, not generic player, hero, trainer, or avatar when practical.
