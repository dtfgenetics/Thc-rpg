# Vertical Playable Slice 1 Scope

## Goal

Prove that THC: Pheno Quest has a fun battle loop before investing in world maps, breeding, trading, or multiplayer.

## One-Sentence Slice

A player loads a starter party, starts a rival grower battle, chooses moves, performs Strain Addition timing, builds Pheno Awakening, wins or loses, then sees rewards.

## Acceptance Criteria

1. Project installs locally with `npm install`.
2. Database migrations run.
3. Seed command creates starter companions, moves, and one NPC rival.
4. API health endpoint responds.
5. Dev player can be created or loaded.
6. Player can start the first battle.
7. Player can select a move.
8. Client can submit timing result.
9. Server validates the action.
10. Server caps the timing bonus.
11. Server calculates damage.
12. Battle log records what happened.
13. NPC takes a response turn.
14. Awakening meter charges.
15. Player can activate Pheno Awakening at 100 meter.
16. Battle ends in win/loss.
17. XP/reward screen appears.

## First Battle

### Player Party

- Blue Mango
- Sour Diesel
- Granddaddy Purple

### NPC Rival

Name: Rival Grower Ashtray

Party:
- Skunk Scout
- Kush Bruiser

## Battle UI Requirements

Minimum viable UI:
- player party panel
- enemy panel
- active companion HP
- move buttons
- timing mini-game area
- Awakening meter
- battle log
- result screen

No advanced animation is required for the first slice.

## Technical Rule

The browser cannot decide final damage. It can only report timing performance. The API must validate battle state and calculate final results.

## First Route Targets

Local:

```text
http://localhost:3000/games/pheno-quest
```

Production target later:

```text
https://dtfseeds.com/games/pheno-quest/
```

## Definition of Done

The slice is done when the user can play the first battle from start to finish without editing database records manually.
