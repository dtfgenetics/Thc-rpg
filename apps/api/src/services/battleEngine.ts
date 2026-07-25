import type { Battle, CompanionTemplate, MoveTemplate, Player } from "@prisma/client";
import {
  applyXp,
  AWAKENING_DURATION_TURNS,
  calculateDamage,
  canActivateAwakening,
  decrementAwakeningTurns,
  getFirstAlive,
  sanitizeTiming,
  type BattleLogEntry,
  type BattleRewards,
  type BattleSide,
  type BattleState,
  type CombatantState,
  type CompanionType,
  type MoveKind,
  type MoveTemplateView,
  type TimingResultInput,
  type TurnActionInput
} from "@thc/shared";
import { prisma } from "../prismaClient.js";

const DEFAULT_NPC_SLUG = "rival-grower-ashtray";
const devPlayerLocks = new Map<string, Promise<Player>>();

type TemplateWithMoves = CompanionTemplate & {
  moves: Array<{
    moveTemplate: MoveTemplate;
    levelRequired: number;
  }>;
};

type NpcPartyEntry = {
  templateSlug: string;
  level: number;
};

function asCompanionType(value: string): CompanionType {
  return value as CompanionType;
}

function asMoveKind(value: string): MoveKind {
  return value as MoveKind;
}

function toMoveView(move: MoveTemplate): MoveTemplateView {
  return {
    slug: move.slug,
    name: move.name,
    type: asCompanionType(move.type),
    kind: asMoveKind(move.kind),
    basePower: move.basePower,
    accuracy: move.accuracy,
    meterGain: move.meterGain,
    timingPattern: Array.isArray(move.timingPattern) ? (move.timingPattern as number[]) : [500],
    goodBonusCap: move.goodBonusCap,
    perfectBonusCap: move.perfectBonusCap,
    statusEffect: move.statusEffect,
    awakeningOnly: move.awakeningOnly,
    cooldown: move.cooldown
  };
}

function scaledStat(base: number, level: number, perLevel = 2): number {
  return base + Math.max(0, level - 1) * perLevel;
}

function scaledMaxHp(template: CompanionTemplate, level: number): number {
  return scaledStat(template.baseHp, level, 10);
}

function templateToCombatant(params: {
  id: string;
  template: TemplateWithMoves;
  side: BattleSide;
  level: number;
  xp?: number;
  nickname?: string | null;
  currentHp?: number | null;
}): CombatantState {
  const { id, template, side, level, xp = 0, nickname, currentHp } = params;
  const maxHp = scaledMaxHp(template, level);
  const safeCurrentHp = Math.max(0, Math.min(maxHp, currentHp ?? maxHp));

  return {
    id,
    templateSlug: template.slug,
    name: nickname || template.name,
    side,
    primaryType: asCompanionType(template.primaryType),
    secondaryType: template.secondaryType ? asCompanionType(template.secondaryType) : null,
    role: template.role,
    level,
    xp,
    maxHp,
    currentHp: safeCurrentHp,
    stats: {
      hp: maxHp,
      potency: scaledStat(template.potency, level),
      vigor: scaledStat(template.vigor, level),
      speed: scaledStat(template.speed, level),
      resin: scaledStat(template.resin, level),
      terpenes: scaledStat(template.terpenes, level),
      stability: scaledStat(template.stability, level)
    },
    awakeningName: template.awakeningName,
    awakeningMeter: 0,
    awakenedTurnsRemaining: 0,
    shield: 0,
    statusEffects: [],
    moves: template.moves
      .filter((entry) => entry.levelRequired <= level)
      .map((entry) => toMoveView(entry.moveTemplate))
  };
}

export async function ensureDevPlayer(handle = "DTF Demo Grower"): Promise<Player> {
  const inFlight = devPlayerLocks.get(handle);
  if (inFlight) return inFlight;

  const operation = ensureDevPlayerUnlocked(handle);
  devPlayerLocks.set(handle, operation);
  try {
    return await operation;
  } finally {
    if (devPlayerLocks.get(handle) === operation) devPlayerLocks.delete(handle);
  }
}

async function ensureDevPlayerUnlocked(handle: string): Promise<Player> {
  const player = await prisma.player.upsert({
    where: { handle },
    update: {},
    create: { handle, kushCoin: 0, reputation: 0 }
  });

  const existingSlots = await prisma.partySlot.count({ where: { playerId: player.id } });
  if (existingSlots > 0) return player;

  const starters = await prisma.companionTemplate.findMany({
    where: { starter: true },
    orderBy: { name: "asc" }
  });

  const starterOrder = ["blue-mango", "sour-diesel", "granddaddy-purple"];
  const orderedStarters = starterOrder
    .map((slug) => starters.find((starter) => starter.slug === slug))
    .filter(Boolean) as CompanionTemplate[];

  for (const [index, starter] of orderedStarters.entries()) {
    const companion = await prisma.playerCompanion.create({
      data: {
        playerId: player.id,
        templateId: starter.id,
        level: 1,
        xp: 0,
        currentHp: scaledMaxHp(starter, 1)
      }
    });

    await prisma.partySlot.create({
      data: {
        playerId: player.id,
        companionId: companion.id,
        position: index + 1
      }
    });
  }

  return player;
}

export async function getPlayerSummary(playerId: string) {
  return prisma.player.findUniqueOrThrow({
    where: { id: playerId },
    include: {
      partySlots: {
        orderBy: { position: "asc" },
        include: {
          companion: {
            include: {
              template: true
            }
          }
        }
      }
    }
  });
}

export async function startBattle(playerId: string, npcSlug = DEFAULT_NPC_SLUG): Promise<BattleState> {
  const player = await prisma.player.findUniqueOrThrow({
    where: { id: playerId },
    include: {
      partySlots: {
        orderBy: { position: "asc" },
        include: {
          companion: {
            include: {
              template: {
                include: {
                  moves: {
                    include: {
                      moveTemplate: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (player.partySlots.length === 0) {
    throw new Error("Player has no active party. Run the dev player setup first.");
  }

  if (npcSlug === DEFAULT_NPC_SLUG) {
    const chapterUnlock = await prisma.playerUnlock.findUnique({
      where: { playerId_slug: { playerId, slug: "quest:clear-resin-wall:claimed" } }
    });
    if (!chapterUnlock) {
      throw new Error("Clear the Resin Wall quest and claim its reward before challenging Ashtray.");
    }
  }

  const npc = await prisma.npcTemplate.findUniqueOrThrow({ where: { slug: npcSlug } });
  const npcParty = npc.partyJson as NpcPartyEntry[];

  const playerTeam = player.partySlots.map((slot) =>
    templateToCombatant({
      id: slot.companion.id,
      template: slot.companion.template as TemplateWithMoves,
      side: "PLAYER",
      level: slot.companion.level,
      xp: slot.companion.xp,
      nickname: slot.companion.nickname,
      currentHp: slot.companion.currentHp
    })
  );

  if (isTeamDefeated(playerTeam)) {
    throw new Error("All active companions are fainted. Use a Cure Station before starting another battle.");
  }

  const enemyTeam: CombatantState[] = [];
  for (const [index, entry] of npcParty.entries()) {
    const template = await prisma.companionTemplate.findUniqueOrThrow({
      where: { slug: entry.templateSlug },
      include: {
        moves: {
          include: {
            moveTemplate: true
          }
        }
      }
    });

    enemyTeam.push(
      templateToCombatant({
        id: `enemy-${template.slug}-${index + 1}`,
        template: template as TemplateWithMoves,
        side: "ENEMY",
        level: entry.level
      })
    );
  }

  const initialLog: BattleLogEntry[] = [
    {
      turn: 1,
      side: "SYSTEM",
      message: `${player.handle} challenged ${npc.name}.`
    }
  ];

  const createdBattle = await prisma.battle.create({
    data: {
      playerId,
      npcSlug,
      status: "ACTIVE",
      turnNumber: 1,
      activeSide: "PLAYER",
      state: {},
      log: initialLog as never
    }
  });

  const state: BattleState = {
    id: createdBattle.id,
    playerId,
    npcSlug,
    status: "ACTIVE",
    turnNumber: 1,
    activeSide: "PLAYER",
    playerTeam,
    enemyTeam,
    log: initialLog
  };

  await saveBattleState(createdBattle.id, state);
  return state;
}

export async function getBattleState(battleId: string): Promise<BattleState> {
  const battle = await prisma.battle.findUniqueOrThrow({ where: { id: battleId } });
  return battle.state as unknown as BattleState;
}

export async function activateAwakening(battleId: string, playerId: string, actorId: string): Promise<BattleState> {
  const battle = await prisma.battle.findUniqueOrThrow({ where: { id: battleId } });
  const state = battle.state as unknown as BattleState;

  assertActivePlayerBattle(state, playerId);

  const actor = state.playerTeam.find((combatant) => combatant.id === actorId);
  if (!actor) throw new Error("Actor is not in the player's party.");
  if (!canActivateAwakening(actor)) throw new Error("Pheno Awakening is not ready.");

  actor.awakeningMeter = 0;
  actor.awakenedTurnsRemaining = AWAKENING_DURATION_TURNS;
  state.log.push({
    turn: state.turnNumber,
    side: "PLAYER",
    message: `${actor.name} entered ${actor.awakeningName}.`
  });

  await saveBattleState(battleId, state);
  return state;
}

export async function resolvePlayerTurn(input: TurnActionInput): Promise<BattleState> {
  const battle = await prisma.battle.findUniqueOrThrow({ where: { id: input.battleId } });
  const state = battle.state as unknown as BattleState;

  assertActivePlayerBattle(state, input.playerId);

  const actor = findCombatantOrThrow(state.playerTeam, input.actorId, "Actor");
  const target = findCombatantOrThrow(state.enemyTeam, input.targetId, "Target");
  const move = findLegalMoveOrThrow(actor, input.moveSlug);

  applyMove({ state, actor, target, move, timing: input.timing });
  actor.awakenedTurnsRemaining = decrementAwakeningTurns(actor).awakenedTurnsRemaining;

  if (isTeamDefeated(state.enemyTeam)) {
    await finishBattle(battle, state, "WON");
    return state;
  }

  resolveEnemyTurn(state);

  if (isTeamDefeated(state.playerTeam)) {
    await finishBattle(battle, state, "LOST");
    return state;
  }

  state.turnNumber += 1;
  state.activeSide = "PLAYER";
  await saveBattleState(battle.id, state);
  return state;
}

function assertActivePlayerBattle(state: BattleState, playerId: string) {
  if (state.playerId !== playerId) throw new Error("This player does not own the battle.");
  if (state.status !== "ACTIVE") throw new Error("Battle is not active.");
  if (state.activeSide !== "PLAYER") throw new Error("It is not the player's turn.");
}

function findCombatantOrThrow(team: CombatantState[], combatantId: string, label: string): CombatantState {
  const combatant = team.find((entry) => entry.id === combatantId);
  if (!combatant) throw new Error(`${label} does not exist.`);
  if (combatant.currentHp <= 0) throw new Error(`${label} is knocked out.`);
  return combatant;
}

function findLegalMoveOrThrow(actor: CombatantState, moveSlug: string): MoveTemplateView {
  const move = actor.moves.find((entry) => entry.slug === moveSlug);
  if (!move) throw new Error("Move is not known by this companion.");
  if (move.awakeningOnly && actor.awakenedTurnsRemaining <= 0) {
    throw new Error("Move requires Pheno Awakening.");
  }
  return move;
}

function applyMove(params: {
  state: BattleState;
  actor: CombatantState;
  target: CombatantState;
  move: MoveTemplateView;
  timing: TimingResultInput;
}) {
  const { state, actor, target, move, timing } = params;
  const safeTiming = sanitizeTiming(timing, move);

  if (move.kind === "SHIELD") {
    const shieldGain = Math.floor(18 + actor.stats.resin * (safeTiming.grade === "PERFECT" ? 1.4 : safeTiming.grade === "GOOD" ? 1.1 : 0.9));
    actor.shield += shieldGain;
    actor.awakeningMeter = Math.min(100, actor.awakeningMeter + move.meterGain);
    state.log.push({
      turn: state.turnNumber,
      side: actor.side,
      message: `${actor.name} used ${move.name} and gained ${shieldGain} shield.`
    });
    return;
  }

  const result = calculateDamage(actor, target, move, safeTiming);
  target.shield = Math.max(0, target.shield - result.shieldAbsorbed);
  target.currentHp = Math.max(0, target.currentHp - result.damage);
  actor.awakeningMeter = Math.min(100, actor.awakeningMeter + result.meterGain);

  if (move.kind === "DEBUFF" && move.statusEffect && target.currentHp > 0) {
    const resistRoll = target.stats.stability - actor.stats.terpenes;
    const shouldApply = safeTiming.grade === "PERFECT" || resistRoll < 6;
    if (shouldApply && !target.statusEffects.includes(move.statusEffect)) {
      target.statusEffects.push(move.statusEffect);
    }
  }

  state.log.push({
    turn: state.turnNumber,
    side: actor.side,
    message: `${actor.name} used ${move.name} for ${result.damage} damage (${safeTiming.grade}, x${result.timingMultiplier}).`
  });

  if (target.currentHp <= 0) {
    state.log.push({
      turn: state.turnNumber,
      side: "SYSTEM",
      message: `${target.name} was knocked out.`
    });
  }
}

function resolveEnemyTurn(state: BattleState) {
  const enemy = getFirstAlive(state.enemyTeam);
  const target = getFirstAlive(state.playerTeam);
  if (!enemy || !target) return;

  const move = enemy.moves.find((entry) => entry.kind === "DAMAGE") || enemy.moves[0];
  applyMove({
    state,
    actor: enemy,
    target,
    move,
    timing: { grade: "GOOD", hitCount: Math.max(1, Math.floor(move.timingPattern.length / 2)) }
  });
  enemy.awakenedTurnsRemaining = decrementAwakeningTurns(enemy).awakenedTurnsRemaining;
}

function isTeamDefeated(team: CombatantState[]): boolean {
  return team.every((combatant) => combatant.currentHp <= 0);
}

async function finishBattle(battle: Battle, state: BattleState, outcome: "WON" | "LOST") {
  state.status = outcome;
  state.activeSide = "PLAYER";

  if (outcome === "WON") {
    const rewards: BattleRewards = {
      xp: 35,
      kushCoin: 50,
      reputation: 5
    };
    state.rewards = rewards;
    state.log.push({
      turn: state.turnNumber,
      side: "SYSTEM",
      message: `Victory. Earned ${rewards.xp} XP, ${rewards.kushCoin} Kush Coin, and ${rewards.reputation} Reputation.`
    });

    await prisma.player.update({
      where: { id: state.playerId },
      data: {
        kushCoin: { increment: rewards.kushCoin },
        reputation: { increment: rewards.reputation }
      }
    });

    await prisma.playerUnlock.upsert({
      where: { playerId_slug: { playerId: state.playerId, slug: `battle-won:${state.npcSlug}` } },
      update: { source: `battle:${state.npcSlug}` },
      create: { playerId: state.playerId, slug: `battle-won:${state.npcSlug}`, source: `battle:${state.npcSlug}` }
    });

    for (const combatant of state.playerTeam) {
      const nextProgress = applyXp(combatant.level, combatant.xp, rewards.xp);
      combatant.level = nextProgress.level;
      combatant.xp = nextProgress.xp;
      await prisma.playerCompanion.update({
        where: { id: combatant.id },
        data: {
          level: nextProgress.level,
          xp: nextProgress.xp,
          currentHp: Math.max(0, combatant.currentHp)
        }
      });
    }
  } else {
    state.log.push({
      turn: state.turnNumber,
      side: "SYSTEM",
      message: "Defeat. Seed Man returned to the last Cure Station. Use it to fully recover and try again."
    });

    for (const combatant of state.playerTeam) {
      await prisma.playerCompanion.update({
        where: { id: combatant.id },
        data: { currentHp: Math.min(1, combatant.maxHp) }
      });
    }
  }

  await prisma.battle.update({
    where: { id: battle.id },
    data: {
      status: outcome,
      turnNumber: state.turnNumber,
      activeSide: state.activeSide,
      state: state as never,
      log: state.log as never,
      rewardsJson: state.rewards ? (state.rewards as never) : undefined
    }
  });
}

async function saveBattleState(battleId: string, state: BattleState) {
  await prisma.battle.update({
    where: { id: battleId },
    data: {
      status: state.status,
      turnNumber: state.turnNumber,
      activeSide: state.activeSide,
      state: state as never,
      log: state.log as never,
      rewardsJson: state.rewards ? (state.rewards as never) : undefined
    }
  });
}
