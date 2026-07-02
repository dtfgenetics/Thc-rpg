import type {
  DialogueTemplateView,
  PlayerQuestView,
  QuestRewards,
  QuestStepDefinition,
  QuestStatus,
  QuestTemplateView,
  RecruitEventView,
  RecruitRequirement,
  RecruitmentResult
} from "@thc/rpg-kernel";
import { prisma } from "../prismaClient.js";

function toDialogueView(dialogue: {
  slug: string;
  title: string;
  speakerName: string;
  regionSlug: string | null;
  nodesJson: unknown;
}): DialogueTemplateView {
  return {
    slug: dialogue.slug,
    title: dialogue.title,
    speakerName: dialogue.speakerName,
    regionSlug: dialogue.regionSlug,
    nodes: Array.isArray(dialogue.nodesJson) ? (dialogue.nodesJson as DialogueTemplateView["nodes"]) : []
  };
}

function toQuestTemplateView(quest: {
  slug: string;
  name: string;
  description: string;
  regionSlug: string | null;
  stepsJson: unknown;
  rewardsJson: unknown;
}): QuestTemplateView {
  return {
    slug: quest.slug,
    name: quest.name,
    description: quest.description,
    regionSlug: quest.regionSlug,
    steps: Array.isArray(quest.stepsJson) ? (quest.stepsJson as QuestStepDefinition[]) : [],
    rewards: (quest.rewardsJson ?? {}) as QuestRewards
  };
}

function toPlayerQuestView(row: {
  status: string;
  currentStepIndex: number;
  completedStepIds: unknown;
  completedAt: Date | null;
  questTemplate: {
    slug: string;
    name: string;
    description: string;
    regionSlug: string | null;
    stepsJson: unknown;
    rewardsJson: unknown;
  };
}): PlayerQuestView {
  return {
    quest: toQuestTemplateView(row.questTemplate),
    status: row.status as QuestStatus,
    currentStepIndex: row.currentStepIndex,
    completedStepIds: Array.isArray(row.completedStepIds) ? (row.completedStepIds as string[]) : [],
    completedAt: row.completedAt?.toISOString() ?? null
  };
}

function toRecruitView(recruit: {
  slug: string;
  companionTemplateSlug: string;
  displayName: string;
  description: string;
  requirementsJson: unknown;
  rewardText: string;
}): RecruitEventView {
  return {
    slug: recruit.slug,
    companionTemplateSlug: recruit.companionTemplateSlug,
    displayName: recruit.displayName,
    description: recruit.description,
    requirements: Array.isArray(recruit.requirementsJson) ? (recruit.requirementsJson as RecruitRequirement[]) : [],
    rewardText: recruit.rewardText
  };
}

export async function getDialogue(dialogueSlug: string): Promise<DialogueTemplateView> {
  const dialogue = await prisma.dialogueTemplate.findUniqueOrThrow({ where: { slug: dialogueSlug } });
  return toDialogueView(dialogue);
}

export async function getPlayerQuests(playerId: string): Promise<PlayerQuestView[]> {
  await prisma.player.findUniqueOrThrow({ where: { id: playerId } });

  const rows = await prisma.playerQuest.findMany({
    where: { playerId },
    orderBy: { createdAt: "asc" },
    include: { questTemplate: true }
  });

  return rows.map(toPlayerQuestView);
}

export async function startQuest(playerId: string, questSlug: string): Promise<PlayerQuestView> {
  await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  const questTemplate = await prisma.questTemplate.findUniqueOrThrow({ where: { slug: questSlug } });

  const row = await prisma.playerQuest.upsert({
    where: {
      playerId_questTemplateId: {
        playerId,
        questTemplateId: questTemplate.id
      }
    },
    update: {},
    create: {
      playerId,
      questTemplateId: questTemplate.id,
      status: "ACTIVE",
      currentStepIndex: 0,
      completedStepIds: []
    },
    include: { questTemplate: true }
  });

  return toPlayerQuestView(row);
}

export async function advanceQuest(params: {
  playerId: string;
  questSlug: string;
  actionType: QuestStepDefinition["actionType"];
  targetSlug: string;
}): Promise<{ quest: PlayerQuestView; message: string }> {
  const { playerId, questSlug, actionType, targetSlug } = params;
  await prisma.player.findUniqueOrThrow({ where: { id: playerId } });

  const questTemplate = await prisma.questTemplate.findUniqueOrThrow({ where: { slug: questSlug } });
  const existing = await prisma.playerQuest.findUnique({
    where: {
      playerId_questTemplateId: {
        playerId,
        questTemplateId: questTemplate.id
      }
    },
    include: { questTemplate: true }
  });

  const questRow = existing ?? (await prisma.playerQuest.create({
    data: {
      playerId,
      questTemplateId: questTemplate.id,
      status: "ACTIVE",
      currentStepIndex: 0,
      completedStepIds: []
    },
    include: { questTemplate: true }
  }));

  if (questRow.status === "CLAIMED") {
    return { quest: toPlayerQuestView(questRow), message: "Quest reward already claimed." };
  }

  const steps = Array.isArray(questTemplate.stepsJson) ? (questTemplate.stepsJson as QuestStepDefinition[]) : [];
  const currentStep = steps[questRow.currentStepIndex];

  if (!currentStep) {
    const completed = await prisma.playerQuest.update({
      where: { id: questRow.id },
      data: { status: "COMPLETED", completedAt: new Date() },
      include: { questTemplate: true }
    });
    return { quest: toPlayerQuestView(completed), message: `${questTemplate.name} is ready to claim.` };
  }

  if (currentStep.actionType !== actionType || currentStep.targetSlug !== targetSlug) {
    return {
      quest: toPlayerQuestView(questRow),
      message: `Current quest step: ${currentStep.label}`
    };
  }

  const completedStepIds = Array.isArray(questRow.completedStepIds) ? (questRow.completedStepIds as string[]) : [];
  const nextCompleted = Array.from(new Set([...completedStepIds, currentStep.id]));
  const nextIndex = questRow.currentStepIndex + 1;
  const isComplete = nextIndex >= steps.length;

  const updated = await prisma.playerQuest.update({
    where: { id: questRow.id },
    data: {
      currentStepIndex: Math.min(nextIndex, steps.length),
      completedStepIds: nextCompleted,
      status: isComplete ? "COMPLETED" : "ACTIVE",
      completedAt: isComplete ? new Date() : questRow.completedAt
    },
    include: { questTemplate: true }
  });

  return {
    quest: toPlayerQuestView(updated),
    message: isComplete ? `${questTemplate.name} completed. Claim your reward.` : `Quest updated: ${steps[nextIndex]?.label ?? "Return for reward"}`
  };
}

export async function claimQuest(playerId: string, questSlug: string): Promise<{ quest: PlayerQuestView; message: string; rewards: QuestRewards }> {
  await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  const questTemplate = await prisma.questTemplate.findUniqueOrThrow({ where: { slug: questSlug } });
  const row = await prisma.playerQuest.findUniqueOrThrow({
    where: {
      playerId_questTemplateId: {
        playerId,
        questTemplateId: questTemplate.id
      }
    },
    include: { questTemplate: true }
  });

  if (row.status === "CLAIMED") {
    return { quest: toPlayerQuestView(row), message: "Quest reward already claimed.", rewards: row.questTemplate.rewardsJson as QuestRewards };
  }

  if (row.status !== "COMPLETED") {
    throw new Error("Quest is not complete yet.");
  }

  const rewards = questTemplate.rewardsJson as QuestRewards;

  await prisma.$transaction(async (tx) => {
    await tx.player.update({
      where: { id: playerId },
      data: {
        kushCoin: rewards.kushCoin ? { increment: rewards.kushCoin } : undefined,
        reputation: rewards.reputation ? { increment: rewards.reputation } : undefined
      }
    });

    for (const unlockSlug of rewards.unlockSlugs ?? []) {
      await tx.playerUnlock.upsert({
        where: { playerId_slug: { playerId, slug: unlockSlug } },
        update: { source: `quest:${questSlug}` },
        create: { playerId, slug: unlockSlug, source: `quest:${questSlug}` }
      });
    }

    for (const itemSlug of rewards.itemSlugs ?? []) {
      const item = await tx.itemTemplate.findUniqueOrThrow({ where: { slug: itemSlug } });
      await tx.playerInventoryItem.upsert({
        where: { playerId_itemId: { playerId, itemId: item.id } },
        update: { quantity: item.stackable ? { increment: 1 } : 1 },
        create: { playerId, itemId: item.id, quantity: 1 }
      });
    }

    await tx.playerQuest.update({
      where: { id: row.id },
      data: { status: "CLAIMED" }
    });
  });

  const claimed = await prisma.playerQuest.findUniqueOrThrow({
    where: { id: row.id },
    include: { questTemplate: true }
  });

  return {
    quest: toPlayerQuestView(claimed),
    message: `${questTemplate.name} reward claimed.`,
    rewards
  };
}

export async function getRecruitEvents(playerId: string): Promise<Array<RecruitEventView & { claimed: boolean; available: boolean }>> {
  await prisma.player.findUniqueOrThrow({ where: { id: playerId } });

  const [events, claims, quests, unlocks, inventory] = await Promise.all([
    prisma.recruitEvent.findMany({ orderBy: { displayName: "asc" } }),
    prisma.playerRecruitClaim.findMany({ where: { playerId }, include: { recruitEvent: true } }),
    prisma.playerQuest.findMany({ where: { playerId }, include: { questTemplate: true } }),
    prisma.playerUnlock.findMany({ where: { playerId } }),
    prisma.playerInventoryItem.findMany({ where: { playerId }, include: { item: true } })
  ]);

  const claimedSlugs = new Set(claims.map((claim) => claim.recruitEvent.slug));
  return events.map((event) => {
    const view = toRecruitView(event);
    return {
      ...view,
      claimed: claimedSlugs.has(event.slug),
      available: requirementsMet(view.requirements, { quests, unlocks, inventory })
    };
  });
}

export async function recruitCompanion(playerId: string, recruitSlug: string): Promise<RecruitmentResult> {
  await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  const recruitEvent = await prisma.recruitEvent.findUniqueOrThrow({
    where: { slug: recruitSlug },
    include: { companionTemplate: true }
  });

  const alreadyClaimed = await prisma.playerRecruitClaim.findUnique({
    where: {
      playerId_recruitEventId: {
        playerId,
        recruitEventId: recruitEvent.id
      }
    }
  });

  if (alreadyClaimed) {
    return {
      success: false,
      message: "This companion has already been recruited.",
      companionTemplateSlug: recruitEvent.companionTemplateSlug,
      playerCompanionId: alreadyClaimed.companionId ?? undefined
    };
  }

  const [quests, unlocks, inventory] = await Promise.all([
    prisma.playerQuest.findMany({ where: { playerId }, include: { questTemplate: true } }),
    prisma.playerUnlock.findMany({ where: { playerId } }),
    prisma.playerInventoryItem.findMany({ where: { playerId }, include: { item: true } })
  ]);

  const requirements = Array.isArray(recruitEvent.requirementsJson) ? (recruitEvent.requirementsJson as RecruitRequirement[]) : [];
  if (!requirementsMet(requirements, { quests, unlocks, inventory })) {
    throw new Error("Recruitment requirements are not met yet.");
  }

  const created = await prisma.$transaction(async (tx) => {
    const companion = await tx.playerCompanion.create({
      data: {
        playerId,
        templateId: recruitEvent.companionTemplate.id,
        level: 1,
        xp: 0
      }
    });

    await tx.playerRecruitClaim.create({
      data: {
        playerId,
        recruitEventId: recruitEvent.id,
        companionId: companion.id
      }
    });

    return companion;
  });

  return {
    success: true,
    message: recruitEvent.rewardText,
    companionTemplateSlug: recruitEvent.companionTemplateSlug,
    playerCompanionId: created.id
  };
}

function requirementsMet(
  requirements: RecruitRequirement[],
  state: {
    quests: Array<{ status: string; questTemplate: { slug: string } }>;
    unlocks: Array<{ slug: string }>;
    inventory: Array<{ item: { slug: string } }>;
  }
): boolean {
  return requirements.every((requirement) => {
    if (requirement.type === "QUEST_CLAIMED") {
      return state.quests.some((quest) => quest.questTemplate.slug === requirement.slug && quest.status === "CLAIMED");
    }

    if (requirement.type === "UNLOCK") {
      return state.unlocks.some((unlock) => unlock.slug === requirement.slug);
    }

    if (requirement.type === "ITEM_OWNED") {
      return state.inventory.some((row) => row.item.slug === requirement.slug);
    }

    return false;
  });
}
