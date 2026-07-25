import type { CompanionType } from "./battleTypes.js";

const STRONG_MATCHUPS: Partial<Record<CompanionType, CompanionType[]>> = {
  SATIVA: ["INDICA"],
  INDICA: ["GAS"],
  GAS: ["CBD"],
  CBD: ["EXTRACT"],
  EXTRACT: ["HYBRID"],
  HYBRID: ["SATIVA"],
  FRUIT: ["PURPLE"],
  PURPLE: ["SATIVA"],
  LANDRACE: ["HYBRID", "FRUIT"]
};

const RESIST_MATCHUPS: Partial<Record<CompanionType, CompanionType[]>> = {
  INDICA: ["SATIVA"],
  SATIVA: ["HYBRID"],
  HYBRID: ["EXTRACT"],
  CBD: ["GAS"],
  EXTRACT: ["CBD"],
  PURPLE: ["FRUIT"],
  FRUIT: ["GAS"],
  LANDRACE: ["PURPLE"]
};

export function getTypeMultiplier(
  attackType: CompanionType,
  defenderPrimary: CompanionType,
  defenderSecondary?: CompanionType | null
): number {
  const defenderTypes = [defenderPrimary, defenderSecondary].filter(Boolean) as CompanionType[];
  let multiplier = 1;

  for (const defenderType of defenderTypes) {
    if (STRONG_MATCHUPS[attackType]?.includes(defenderType)) multiplier *= 1.25;
    if (RESIST_MATCHUPS[attackType]?.includes(defenderType)) multiplier *= 0.85;
  }

  return Number(multiplier.toFixed(2));
}
