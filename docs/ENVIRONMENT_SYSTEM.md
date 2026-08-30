# Environment System

## Purpose

The grow room is now persistent game state rather than scenery. Room conditions are evaluated each simulation tick and feed bounded modifiers into plant stress, health, and development.

The values in this system are gameplay tuning values for THC RPG. They are not intended to function as a real-world cultivation operating guide.

## Environment fields

The room currently stores:

- `temperature`
- `humidity`
- `light` (0–100 game intensity)
- `ph`
- `ec`

VPD is derived from temperature and humidity and is not separately stored.

## Evaluation

`Environment.evaluate(stage)` returns:

- overall room score (0–100)
- status (`good`, `warning`, `danger`)
- calculated VPD
- per-factor scores
- stress rate
- health-damage rate
- growth modifier

Stage targets are internal balance data. The scoring function deliberately degrades gradually rather than using instant fail states.

## Plant integration

On each game update:

1. `Game` evaluates the current room for the plant's stage.
2. The resulting effects are passed to `Plant.update()`.
3. Plant resilience moderates environment-driven stress and health damage.
4. Poor conditions reduce growth rate and can increase stress/health loss.
5. The most recent environment score is stored with the plant for future UI and telemetry.

## Save compatibility

Save format v4 adds an `environment` object. Save versions 1–3 still load; older saves receive the default room state and are upgraded the next time they are saved.

## Architecture boundary

`Environment` owns room conditions. `Plant` owns biological state. `Game` coordinates the two. Equipment and upgrades should modify environment state or its control limits rather than directly rewriting plant genetics.
