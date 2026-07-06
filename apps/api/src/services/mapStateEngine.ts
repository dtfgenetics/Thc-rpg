import type { RegionMapStateView, RegionRecruitStateView } from "@thc/rpg-kernel";
import { prisma } from "../prismaClient.js";

const REGION_ITEM_SLUGS: Record<string, string[]> = {
  "growers-grove": ["terp-tonic", "grinder-relic", "vapor-lens"]
};

const REGION_QUEST_SLUGS: Record<string, string[]> = {
  "growers-grove": ["clear-resin-wall"]
};

const REGION_RECRUIT_SLUGS: Record<string, string[]> = {
  "growers-grove": ["recruit-skunk-scout"]
};

export async function getRegionMapState(playerId: string, regionSlug: string): Promise<RegionMapStateView> {
  await prisma.player.findUniqueOrThrow({ where: { id: playerId } });

  const itemSlugs = REGION_ITEM_SLUGS[regionSlug] ?? [];
  const questSlugs = REGION_QUEST_SLUGS[regionSlug] ?? [];
  const recruitSlugs = REGION_RECRUIT_SLUGS[regionSlug] ?? [];

  const [items, ownedItems, obstacles, unlocks, savePoints, saveVisits, saveState, questTemplates, playerQuests, recruits, recruitClaims] =
    await Promise.all([
      prisma.itemTemplate.findMany({ where: { slug: { in: itemSlugs } }, orderBy: { name: "asc" } }),
      prisma.playerInventoryItem.findMany({ where: { playerId, item: { slug: { in: itemSlugs } } }, include: { item: true } }),
      prisma.mapObstacleTemplate.findMany({ where: { regionSlug }, orderBy: { name: "asc" } }),
      prisma.playerUnlock.findMany({ where: { playerId } }),
      prisma.savePointTemplate.findMany({ where: { regionSlug }, orderBy: { name: "asc" } }),
      prisma.playerSavePointVisit.findMany({ where: { playerId } }),
      prisma.playerSaveState.findUnique({ where: { playerId } }),
      prisma.questTemplate.findMany({ where: { slug: { in: questSlugs } }, orderBy: { name: "asc" } }),
      prisma.playerQuest.findMany({ where: { playerId }, include: { questTemplate: true } }),
      prisma.recruitEvent.findMany({ where: { slug: { in: recruitSlugs } }, orderBy: { displayName: "asc" } }),
      prisma.playerRecruitClaim.findMany({ where: { playerId }, include: { recruitEvent: true } })
    ]);

  const ownedItemSlugs = new Set(ownedItems.map((row) => row.item.slug));
  const unlockSlugs = unlocks.map((unlock) => unlock.slug);
  const unlockSet = new Set(unlockSlugs);
  const visitedSavePoints = new Set(saveVisits.map((visit) => visit.savePointSlug));
  const questBySlug = new Map(playerQuests.map((quest) => [quest.questTemplate.slug, quest]));
  const claimedRecruitSlugs = new Set(recruitClaims.map((claim) => claim.recruitEvent.slug));

  const recruitStates: RegionRecruitStateView[] = recruits.map((recruit) => ({
    slug: recruit.slug,
    displayName: recruit.displayName,
    available: isRecruitAvailable(recruit.requirementsJson, questBySlug, unlockSet, ownedItemSlugs),
    claimed: claimedRecruitSlugs.has(recruit.slug)
  }));

  return {
    playerId,
    regionSlug,
    items: items.map((item) => ({
      slug: item.slug,
      name: item.name,
      owned: ownedItemSlugs.has(item.slug),
      visible: !ownedItemSlugs.has(item.slug)
    })),
    obstacles: obstacles.map((obstacle) => {
      const cleared = unlockSet.has(obstacle.clearedUnlockSlug);
      return {
        slug: obstacle.slug,
        name: obstacle.name,
        requiredItemSlug: obstacle.requiredItemSlug,
        clearedUnlockSlug: obstacle.clearedUnlockSlug,
        cleared,
        visible: !cleared
      };
    }),
    savePoints: savePoints.map((savePoint) => ({
      slug: savePoint.slug,
      name: savePoint.name,
      visited: visitedSavePoints.has(savePoint.slug),
      active: saveState?.lastSavePointSlug === savePoint.slug
    })),
    quests: questTemplates.map((quest) => {
      const playerQuest = questBySlug.get(quest.slug);
      return {
        slug: quest.slug,
        name: quest.name,
        status: (playerQuest?.status ?? "NOT_STARTED") as "NOT_STARTED" | "ACTIVE" | "COMPLETED" | "CLAIMED",
        currentStepIndex: playerQuest?.currentStepIndex ?? 0
      };
    }),
    recruits: recruitStates,
    unlockSlugs
  };
}

function isRecruitAvailable(
  requirementsJson: unknown,
  questBySlug: Map<string, { status: string }>,
  unlockSet: Set<string>,
  ownedItemSlugs: Set<string>
): boolean {
  if (!Array.isArray(requirementsJson)) return false;

  return requirementsJson.every((requirement) => {
    if (!requirement || typeof requirement !== "object") return false;
    const typedRequirement = requirement as { type?: string; slug?: string };
    if (!typedRequirement.slug) return false;

    if (typedRequirement.type === "QUEST_CLAIMED") {
      return questBySlug.get(typedRequirement.slug)?.status === "CLAIMED";
    }

    if (typedRequirement.type === "UNLOCK") {
      return unlockSet.has(typedRequirement.slug);
    }

    if (typedRequirement.type === "ITEM_OWNED") {
      return ownedItemSlugs.has(typedRequirement.slug);
    }

    return false;
  });
}
