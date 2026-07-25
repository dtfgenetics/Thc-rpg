import type {
  CombatantState,
  DamageResult,
  MoveTemplateView,
  TimingGrade,
  TimingResultInput
} from "./battleTypes.js";
import { getTypeMultiplier } from "./typeChart.js";

export const AWAKENING_THRESHOLD = 100;
export const AWAKENING_DURATION_TURNS = 3;

export function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function sanitizeTiming(input: TimingResultInput, move: MoveTemplateView): TimingResultInput {
  const allowedGrades: TimingGrade[] = ["MISS", "GOOD", "PERFECT"];
  const grade = allowedGrades.includes(input.grade) ? input.grade : "MISS";
  const maxHits = move.timingPattern.length || 1;

  return {
    grade,
    hitCount: Math.floor(clampNumber(input.hitCount, 0, maxHits))
  };
}

export function getTimingMultiplier(timing: TimingResultInput, move: MoveTemplateView): number {
  const sanitized = sanitizeTiming(timing, move);
  const maxHits = move.timingPattern.length || 1;
  const hitRatio = maxHits > 0 ? sanitized.hitCount / maxHits : 0;

  if (sanitized.grade === "PERFECT") {
    return 1 + clampNumber(move.perfectBonusCap * hitRatio, 0, move.perfectBonusCap);
  }

  if (sanitized.grade === "GOOD") {
    return 1 + clampNumber(move.goodBonusCap * hitRatio, 0, move.goodBonusCap);
  }

  return 1;
}

export function calculateDamage(
  attacker: CombatantState,
  defender: CombatantState,
  move: MoveTemplateView,
  timingInput: TimingResultInput
): DamageResult {
  if (move.kind !== "DAMAGE" || move.basePower <= 0) {
    return {
      damage: 0,
      timingMultiplier: 1,
      typeMultiplier: 1,
      shieldAbsorbed: 0,
      meterGain: move.meterGain
    };
  }

  const timingMultiplier = getTimingMultiplier(timingInput, move);
  const typeMultiplier = getTypeMultiplier(move.type, defender.primaryType, defender.secondaryType);
  const awakeningMultiplier = attacker.awakenedTurnsRemaining > 0 ? 1.2 : 1;

  const rawDamage =
    (move.basePower + attacker.stats.potency * 1.45 + attacker.level * 2 - defender.stats.vigor * 0.8) *
    timingMultiplier *
    typeMultiplier *
    awakeningMultiplier;

  const damageBeforeShield = Math.max(1, Math.floor(rawDamage));
  const shieldAbsorbed = Math.min(defender.shield, damageBeforeShield);
  const damage = Math.max(0, damageBeforeShield - shieldAbsorbed);

  return {
    damage,
    timingMultiplier: Number(timingMultiplier.toFixed(2)),
    typeMultiplier,
    shieldAbsorbed,
    meterGain: move.meterGain
  };
}

export function getAliveCombatants(team: CombatantState[]): CombatantState[] {
  return team.filter((combatant) => combatant.currentHp > 0);
}

export function getFirstAlive(team: CombatantState[]): CombatantState | undefined {
  return getAliveCombatants(team)[0];
}

export function canActivateAwakening(combatant: CombatantState): boolean {
  return combatant.currentHp > 0 && combatant.awakeningMeter >= AWAKENING_THRESHOLD && combatant.awakenedTurnsRemaining <= 0;
}

export function decrementAwakeningTurns(combatant: CombatantState): CombatantState {
  if (combatant.awakenedTurnsRemaining <= 0) return combatant;
  return {
    ...combatant,
    awakenedTurnsRemaining: Math.max(0, combatant.awakenedTurnsRemaining - 1)
  };
}

export function xpForNextLevel(level: number): number {
  return 50 + level * level * 15;
}

export function applyXp(level: number, xp: number, gainedXp: number): { level: number; xp: number; leveledUp: boolean } {
  let nextLevel = level;
  let nextXp = xp + gainedXp;
  let leveledUp = false;

  while (nextXp >= xpForNextLevel(nextLevel)) {
    nextXp -= xpForNextLevel(nextLevel);
    nextLevel += 1;
    leveledUp = true;
  }

  return { level: nextLevel, xp: nextXp, leveledUp };
}
