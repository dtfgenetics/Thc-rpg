export type CompanionType =
  | "HYBRID"
  | "FRUIT"
  | "SATIVA"
  | "GAS"
  | "INDICA"
  | "PURPLE"
  | "CBD"
  | "EXTRACT"
  | "LANDRACE";

export type BattleStatus = "ACTIVE" | "WON" | "LOST";
export type BattleSide = "PLAYER" | "ENEMY";
export type TimingGrade = "MISS" | "GOOD" | "PERFECT";
export type MoveKind = "DAMAGE" | "SHIELD" | "DEBUFF";

export interface Stats {
  hp: number;
  potency: number;
  vigor: number;
  speed: number;
  resin: number;
  terpenes: number;
  stability: number;
}

export interface MoveTemplateView {
  slug: string;
  name: string;
  type: CompanionType;
  kind: MoveKind;
  basePower: number;
  accuracy: number;
  meterGain: number;
  timingPattern: number[];
  goodBonusCap: number;
  perfectBonusCap: number;
  statusEffect?: string | null;
  awakeningOnly: boolean;
  cooldown: number;
}

export interface CombatantState {
  id: string;
  templateSlug: string;
  name: string;
  side: BattleSide;
  primaryType: CompanionType;
  secondaryType?: CompanionType | null;
  role: string;
  level: number;
  xp: number;
  maxHp: number;
  currentHp: number;
  stats: Stats;
  awakeningName: string;
  awakeningMeter: number;
  awakenedTurnsRemaining: number;
  shield: number;
  statusEffects: string[];
  moves: MoveTemplateView[];
}

export interface BattleLogEntry {
  turn: number;
  side: BattleSide | "SYSTEM";
  message: string;
}

export interface BattleState {
  id: string;
  status: BattleStatus;
  turnNumber: number;
  activeSide: BattleSide;
  playerId: string;
  npcSlug: string;
  playerTeam: CombatantState[];
  enemyTeam: CombatantState[];
  log: BattleLogEntry[];
  rewards?: BattleRewards;
}

export interface BattleRewards {
  xp: number;
  kushCoin: number;
  reputation: number;
}

export interface TimingResultInput {
  grade: TimingGrade;
  hitCount: number;
}

export interface TurnActionInput {
  battleId: string;
  playerId: string;
  actorId: string;
  targetId: string;
  moveSlug: string;
  timing: TimingResultInput;
}

export interface DamageResult {
  damage: number;
  timingMultiplier: number;
  typeMultiplier: number;
  shieldAbsorbed: number;
  meterGain: number;
}
