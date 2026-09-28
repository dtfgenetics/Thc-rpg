# DTF Game Agent Guidance

This repository is the canonical game repository for **THC RPG — The First Seed**, but portfolio identity, public-route ownership, integration status, and release state are controlled centrally.

## Mandatory game preflight

Before researching, planning, coding, debugging, redesigning, testing, packaging, or deploying this game:

1. Fetch `dtfgenetics/Thc/data/game-registry-v2.json`.
2. Resolve this game through the central registry and confirm its canonical ID, aliases, production repository/source paths, integration owner, public route, architecture summary, release status, blockers, and next milestone.
3. Read this repository's game source-of-truth: `README.md`.
4. Inspect canonical source before editing generated/public/deployment copies.
5. If ownership, route, architecture, or release status intentionally changes, update `game-registry-v2.json` in the same work.
6. DTFSeeds public integration/deployment is coordinated through `dtfgenetics/Thc`; a successful local build does not prove the public game is live.

## Release integrity

Do not claim this game is live unless the exact visitor-facing route is verified after deployment. Preserve exact revision/build evidence for release candidates and external-package integrations.

## Architecture principle

Keep serializable gameplay state separate from renderer/UI state where practical. Reuse the local source-of-truth and tests rather than patching copied integration output as the primary fix.
