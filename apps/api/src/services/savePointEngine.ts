import type { PlayerSaveStateView, SavePointTemplateView, SavePointUseResult } from "@thc/rpg-kernel";
import { prisma } from "../prismaClient.js";

function scaledMaxHp(baseHp: number, level: number): number {
  return baseHp + Math.max(0, level - 1) * 10;
}

function toSavePointView(savePoint: {
  slug: string;
  name: string;
  regionSlug: string;
  description: string;
  recoveryType: string;
  unlockSlug: string;
}): SavePointTemplateView {
  return {
    slug: savePoint.slug,
    name: savePoint.name,
    regionSlug: savePoint.regionSlug,
    description: savePoint.description,
    recoveryType: savePoint.recoveryType === "SAVE_ONLY" ? "SAVE_ONLY" : "PARTY_RECOVER",
    unlockSlug: savePoint.unlockSlug
  };
}

export async function getPlayerSaveState(playerId: string): Promise<PlayerSaveStateView> {
  await prisma.player.findUniqueOrThrow({ where: { id: playerId } });

  const [saveState, visits] = await Promise.all([
    prisma.playerSaveState.findUnique({ where: { playerId } }),
    prisma.playerSavePointVisit.findMany({ where: { playerId }, orderBy: { visitedAt: "asc" } })
  ]);

  return {
    playerId,
    activeRegionSlug: saveState?.activeRegionSlug ?? null,
    lastSavePointSlug: saveState?.lastSavePointSlug ?? null,
    lastSavedAt: saveState?.lastSavedAt?.toISOString() ?? null,
    visitedSavePointSlugs: visits.map((visit) => visit.savePointSlug)
  };
}

export async function getRegionSavePoints(regionSlug: string): Promise<SavePointTemplateView[]> {
  const savePoints = await prisma.savePointTemplate.findMany({
    where: { regionSlug },
    orderBy: { name: "asc" }
  });

  return savePoints.map(toSavePointView);
}

export async function useSavePoint(playerId: string, savePointSlug: string): Promise<SavePointUseResult> {
  await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  const savePoint = await prisma.savePointTemplate.findUniqueOrThrow({ where: { slug: savePointSlug } });
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.playerSaveState.upsert({
      where: { playerId },
      update: {
        activeRegionSlug: savePoint.regionSlug,
        lastSavePointSlug: savePoint.slug,
        lastSavedAt: now
      },
      create: {
        playerId,
        activeRegionSlug: savePoint.regionSlug,
        lastSavePointSlug: savePoint.slug,
        lastSavedAt: now
      }
    });

    await tx.playerSavePointVisit.upsert({
      where: { playerId_savePointSlug: { playerId, savePointSlug: savePoint.slug } },
      update: { visitedAt: now },
      create: { playerId, savePointSlug: savePoint.slug, visitedAt: now }
    });

    await tx.playerUnlock.upsert({
      where: { playerId_slug: { playerId, slug: savePoint.unlockSlug } },
      update: { source: `savepoint:${savePoint.slug}` },
      create: { playerId, slug: savePoint.unlockSlug, source: `savepoint:${savePoint.slug}` }
    });

    if (savePoint.recoveryType !== "SAVE_ONLY") {
      const companions = await tx.playerCompanion.findMany({
        where: { playerId },
        include: { template: true }
      });

      for (const companion of companions) {
        await tx.playerCompanion.update({
          where: { id: companion.id },
          data: { currentHp: scaledMaxHp(companion.template.baseHp, companion.level) }
        });
      }
    }
  });

  const saveState = await getPlayerSaveState(playerId);
  return {
    success: true,
    message:
      savePoint.recoveryType === "SAVE_ONLY"
        ? `${savePoint.name} saved Seed Man's progress.`
        : `${savePoint.name} restored the party and saved Seed Man's progress.`,
    savePoint: toSavePointView(savePoint),
    saveState
  };
}
