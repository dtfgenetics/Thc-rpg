import type { CompanionRosterView, PartyActionResult, PartyStateView } from "@thc/rpg-kernel";
import { prisma } from "../prismaClient.js";

export const MAX_PARTY_SIZE = 3;

export async function getPartyState(playerId: string): Promise<PartyStateView> {
  await prisma.player.findUniqueOrThrow({ where: { id: playerId } });

  const [companions, slots] = await Promise.all([
    prisma.playerCompanion.findMany({
      where: { playerId },
      orderBy: [{ createdAt: "asc" }],
      include: {
        template: {
          include: {
            moves: {
              include: { moveTemplate: true },
              orderBy: { levelRequired: "asc" }
            }
          }
        }
      }
    }),
    prisma.partySlot.findMany({
      where: { playerId },
      orderBy: { position: "asc" }
    })
  ]);

  const slotByCompanionId = new Map(slots.map((slot) => [slot.companionId, slot.position]));
  const roster = companions.map((companion) => toRosterView(companion, slotByCompanionId.get(companion.id) ?? null));
  const activeParty = roster
    .filter((companion) => companion.partyPosition !== null && companion.partyPosition !== undefined)
    .sort((a, b) => (a.partyPosition ?? 99) - (b.partyPosition ?? 99));

  return {
    playerId,
    maxPartySize: MAX_PARTY_SIZE,
    activeParty,
    roster
  };
}

export async function addCompanionToParty(playerId: string, companionId: string): Promise<PartyActionResult> {
  await assertCompanionOwned(playerId, companionId);

  const existingSlot = await prisma.partySlot.findUnique({
    where: { playerId_companionId: { playerId, companionId } }
  });

  if (existingSlot) {
    return {
      success: false,
      message: "Companion is already in the active party.",
      party: await getPartyState(playerId)
    };
  }

  const slots = await prisma.partySlot.findMany({ where: { playerId }, orderBy: { position: "asc" } });
  if (slots.length >= MAX_PARTY_SIZE) {
    throw new Error("Active party is full. Remove or swap a companion first.");
  }

  const usedPositions = new Set(slots.map((slot) => slot.position));
  const position = [1, 2, 3].find((candidate) => !usedPositions.has(candidate)) ?? slots.length + 1;

  await prisma.partySlot.create({
    data: { playerId, companionId, position }
  });

  return {
    success: true,
    message: "Companion added to the active party.",
    party: await getPartyState(playerId)
  };
}

export async function removeCompanionFromParty(playerId: string, companionId: string): Promise<PartyActionResult> {
  await assertCompanionOwned(playerId, companionId);

  const slots = await prisma.partySlot.findMany({ where: { playerId }, orderBy: { position: "asc" } });
  const targetSlot = slots.find((slot) => slot.companionId === companionId);

  if (!targetSlot) {
    return {
      success: false,
      message: "Companion is not in the active party.",
      party: await getPartyState(playerId)
    };
  }

  if (slots.length <= 1) {
    throw new Error("Active party must keep at least one companion.");
  }

  await prisma.partySlot.delete({ where: { id: targetSlot.id } });
  await normalizePartyPositions(playerId);

  return {
    success: true,
    message: "Companion removed from the active party.",
    party: await getPartyState(playerId)
  };
}

export async function swapPartyPositions(playerId: string, firstCompanionId: string, secondCompanionId: string): Promise<PartyActionResult> {
  await assertCompanionOwned(playerId, firstCompanionId);
  await assertCompanionOwned(playerId, secondCompanionId);

  if (firstCompanionId === secondCompanionId) {
    return {
      success: false,
      message: "Choose two different companions to swap.",
      party: await getPartyState(playerId)
    };
  }

  const [firstSlot, secondSlot] = await Promise.all([
    prisma.partySlot.findUnique({ where: { playerId_companionId: { playerId, companionId: firstCompanionId } } }),
    prisma.partySlot.findUnique({ where: { playerId_companionId: { playerId, companionId: secondCompanionId } } })
  ]);

  if (!firstSlot || !secondSlot) {
    throw new Error("Both companions must be in the active party to swap positions.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.partySlot.update({ where: { id: firstSlot.id }, data: { position: 99 } });
    await tx.partySlot.update({ where: { id: secondSlot.id }, data: { position: firstSlot.position } });
    await tx.partySlot.update({ where: { id: firstSlot.id }, data: { position: secondSlot.position } });
  });

  return {
    success: true,
    message: "Party positions swapped.",
    party: await getPartyState(playerId)
  };
}

async function assertCompanionOwned(playerId: string, companionId: string) {
  const companion = await prisma.playerCompanion.findUnique({ where: { id: companionId } });
  if (!companion || companion.playerId !== playerId) {
    throw new Error("Companion does not belong to this player.");
  }
}

async function normalizePartyPositions(playerId: string) {
  const slots = await prisma.partySlot.findMany({ where: { playerId }, orderBy: { position: "asc" } });
  for (const [index, slot] of slots.entries()) {
    await prisma.partySlot.update({ where: { id: slot.id }, data: { position: index + 1 } });
  }
}

function toRosterView(
  companion: Awaited<ReturnType<typeof prisma.playerCompanion.findMany>>[number] & {
    currentHp?: number | null;
    template: {
      slug: string;
      name: string;
      primaryType: string;
      secondaryType: string | null;
      role: string;
      baseHp: number;
      potency: number;
      vigor: number;
      speed: number;
      resin: number;
      terpenes: number;
      stability: number;
      awakeningName: string;
      moves: Array<{
        moveTemplate: {
          slug: string;
          name: string;
          type: string;
          kind: string;
          basePower: number;
        };
        levelRequired: number;
      }>;
    };
  },
  partyPosition: number | null
): CompanionRosterView {
  const levelBonus = Math.max(0, companion.level - 1);
  const maxHp = companion.template.baseHp + levelBonus * 10;
  const currentHp = Math.max(0, Math.min(maxHp, companion.currentHp ?? maxHp));

  return {
    id: companion.id,
    templateSlug: companion.template.slug,
    name: companion.template.name,
    nickname: companion.nickname,
    primaryType: companion.template.primaryType,
    secondaryType: companion.template.secondaryType,
    role: companion.template.role,
    level: companion.level,
    xp: companion.xp,
    currentHp,
    maxHp,
    fainted: currentHp <= 0,
    awakeningName: companion.template.awakeningName,
    stats: {
      hp: maxHp,
      potency: companion.template.potency + levelBonus * 2,
      vigor: companion.template.vigor + levelBonus * 2,
      speed: companion.template.speed + levelBonus * 2,
      resin: companion.template.resin + levelBonus * 2,
      terpenes: companion.template.terpenes + levelBonus * 2,
      stability: companion.template.stability + levelBonus * 2
    },
    moves: companion.template.moves
      .filter((entry) => entry.levelRequired <= companion.level)
      .map((entry) => ({
        slug: entry.moveTemplate.slug,
        name: entry.moveTemplate.name,
        type: entry.moveTemplate.type,
        kind: entry.moveTemplate.kind,
        basePower: entry.moveTemplate.basePower
      })),
    partyPosition
  };
}
