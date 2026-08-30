# Phenotype System

## Purpose

THC RPG separates a genetic line from an individual plant expression. A genetics record defines the expected range; each newly planted seed receives a deterministic phenotype generated from a 32-bit seed.

This lets two plants from the same line differ without allowing random values outside the line's authored balance envelope.

## Phenotype fields

Each plant phenotype stores:

- `seed` — deterministic 32-bit generator seed
- `vigor` — growth-strength expression
- `yieldPotential` — yield ceiling used by harvest calculations
- `qualityPotential` — quality ceiling used by harvest calculations
- `resilience` — moderates environmental stress and health damage
- `floweringDays` — expressed flowering target selected inside the genetics range
- `dominantTraits` — a deterministic subset of the genetics trait list

## Genetics configuration

A genetics entry remains the source of truth for baseline values. `phenotypeVariation` controls how far a new plant may vary around those baselines.

Example:

```json
{
  "vigor": 85,
  "yieldPotential": 80,
  "qualityPotential": 88,
  "resilience": 75,
  "floweringDays": { "min": 56, "max": 70 },
  "phenotypeVariation": {
    "vigor": 6,
    "yieldPotential": 8,
    "qualityPotential": 5,
    "resilience": 6,
    "traitCount": 3
  }
}
```

The generator clamps percentage stats to 0–100 and never selects a flowering target outside `floweringDays.min` / `floweringDays.max`.

## Determinism

The same genetics record plus the same phenotype seed must always produce the same phenotype. This is covered by regression tests and is required for save reliability, debugging, and future breeding systems.

## Save compatibility

Save format v3 stores phenotype data with the plant and continues loading v1 and v2 saves.

Pre-phenotype plants are migrated as baseline expressions. Their saved vigor is preserved, while yield, quality, resilience, flowering time, and traits are initialized from the genetics baseline. Legacy plants are not randomly rerolled during migration.

## Simulation effects

Phenotype currently affects:

- vigor → development speed and yield
- flowering days → compressed development tempo
- yield potential → harvest grams
- quality potential → harvest quality percentage
- resilience → rate of stress accumulation and health damage
- dominant traits → identity data for UI and future breeding/content systems

## Future extension contract

Environment, equipment, training, breeding, and genotype inheritance should modify or interact with phenotype values rather than rewriting static genetics records. Static genetics definitions must remain immutable game content.
