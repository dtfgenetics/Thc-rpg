import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateDamage, canActivateAwakening, getTimingMultiplier } from "./battleMath";
import type { CombatantState, MoveTemplateView } from "./battleTypes";

const move: MoveTemplateView = {
  slug: "test-hit",
  name: "Test Hit",
  type: "FRUIT",
  kind: "DAMAGE",
  basePower: 30,
  accuracy: 100,
  meterGain: 10,
  timingPattern: [400, 800, 1200],
  goodBonusCap: 0.15,
  perfectBonusCap: 0.35,
  awakeningOnly: false,
  cooldown: 0
};

const attacker: CombatantState = {
  id: "a",
  templateSlug: "blue-mango",
  name: "Blue Mango",
  side: "PLAYER",
  primaryType: "HYBRID",
  secondaryType: "FRUIT",
  role: "Balanced",
  level: 1,
  xp: 0,
  maxHp: 100,
  currentHp: 100,
  stats: { hp: 100, potency: 20, vigor: 15, speed: 15, resin: 15, terpenes: 20, stability: 15 },
  awakeningName: "Keeper Pheno",
  awakeningMeter: 0,
  awakenedTurnsRemaining: 0,
  shield: 0,
  statusEffects: [],
  moves: [move]
};

const defender: CombatantState = {
  ...attacker,
  id: "d",
  name: "Granddaddy Purple",
  side: "ENEMY",
  primaryType: "PURPLE",
  secondaryType: null,
  currentHp: 100,
  shield: 0,
  stats: { hp: 100, potency: 15, vigor: 18, speed: 10, resin: 20, terpenes: 12, stability: 18 }
};

describe("battle math", () => {
  it("caps perfect timing multiplier", () => {
    assert.equal(getTimingMultiplier({ grade: "PERFECT", hitCount: 999 }, move), 1.35);
  });

  it("calculates positive server-side damage", () => {
    const result = calculateDamage(attacker, defender, move, { grade: "GOOD", hitCount: 2 });
    assert.ok(result.damage > 0);
    assert.ok(result.timingMultiplier <= 1.15);
  });

  it("requires full meter to awaken", () => {
    assert.equal(canActivateAwakening(attacker), false);
    assert.equal(canActivateAwakening({ ...attacker, awakeningMeter: 100 }), true);
  });
});
