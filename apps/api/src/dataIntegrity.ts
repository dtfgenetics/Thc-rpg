import { prisma } from "./prismaClient.js";

const companionTypes = new Set(["HYBRID", "FRUIT", "SATIVA", "GAS", "INDICA", "PURPLE", "CBD", "EXTRACT", "LANDRACE"]);
const moveKinds = new Set(["DAMAGE", "SHIELD", "DEBUFF"]);
const itemUseContexts = new Set(["BATTLE", "MAP", "MENU", "PASSIVE"]);
const itemEffectTypes = new Set(["HEAL_HP", "GAIN_SHIELD", "CLEAR_OBSTACLE", "REVEAL_PATH", "UNLOCK_REGION", "QUEST_FLAG", "NO_EFFECT"]);
const questActions = new Set(["TALK", "PICKUP", "USE_TOOL", "BATTLE_WIN", "RETURN", "RECRUIT"]);
const recruitRequirementTypes = new Set(["QUEST_CLAIMED", "BATTLE_WON", "UNLOCK", "ITEM_OWNED"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function report(errors: string[], condition: boolean, message: string): void {
  if (!condition) errors.push(message);
}

export async function validateGameData(): Promise<void> {
  const [moves, companions, npcs, items, obstacles, dialogues, quests, recruitEvents, savePoints] = await Promise.all([
    prisma.moveTemplate.findMany({ orderBy: { slug: "asc" } }),
    prisma.companionTemplate.findMany({
      orderBy: { slug: "asc" },
      include: { moves: { include: { moveTemplate: true } } }
    }),
    prisma.npcTemplate.findMany({ orderBy: { slug: "asc" } }),
    prisma.itemTemplate.findMany({ orderBy: { slug: "asc" } }),
    prisma.mapObstacleTemplate.findMany({ orderBy: { slug: "asc" }, include: { requiredItem: true } }),
    prisma.dialogueTemplate.findMany({ orderBy: { slug: "asc" } }),
    prisma.questTemplate.findMany({ orderBy: { slug: "asc" } }),
    prisma.recruitEvent.findMany({ orderBy: { slug: "asc" } }),
    prisma.savePointTemplate.findMany({ orderBy: { slug: "asc" } })
  ]);

  const errors: string[] = [];
  const moveSlugs = new Set(moves.map((entry) => entry.slug));
  const companionSlugs = new Set(companions.map((entry) => entry.slug));
  const npcSlugs = new Set(npcs.map((entry) => entry.slug));
  const itemSlugs = new Set(items.map((entry) => entry.slug));
  const obstacleSlugs = new Set(obstacles.map((entry) => entry.slug));
  const dialogueSlugs = new Set(dialogues.map((entry) => entry.slug));
  const questSlugs = new Set(quests.map((entry) => entry.slug));
  const recruitSlugs = new Set(recruitEvents.map((entry) => entry.slug));

  report(errors, moves.length > 0, "No move templates were seeded.");
  report(errors, companions.length > 0, "No companion templates were seeded.");
  report(errors, companions.filter((entry) => entry.starter).length === 3, "The vertical slice must seed exactly three starter companions.");
  report(errors, npcs.length > 0, "No NPC battle templates were seeded.");
  report(errors, quests.length > 0, "No quest templates were seeded.");
  report(errors, savePoints.length > 0, "No save points were seeded.");

  for (const move of moves) {
    report(errors, companionTypes.has(move.type), `Move ${move.slug} uses unknown type ${move.type}.`);
    report(errors, moveKinds.has(move.kind), `Move ${move.slug} uses unknown kind ${move.kind}.`);
    report(errors, move.basePower >= 0, `Move ${move.slug} has negative base power.`);
    report(errors, move.accuracy >= 1 && move.accuracy <= 100, `Move ${move.slug} accuracy must be between 1 and 100.`);
    report(errors, move.meterGain >= 0 && move.meterGain <= 100, `Move ${move.slug} meter gain must be between 0 and 100.`);
    report(errors, move.goodBonusCap >= 0 && move.goodBonusCap <= 1, `Move ${move.slug} good bonus cap must be between 0 and 1.`);
    report(errors, move.perfectBonusCap >= move.goodBonusCap && move.perfectBonusCap <= 1, `Move ${move.slug} perfect bonus cap must be at least the good cap and no more than 1.`);

    const timing = move.timingPattern;
    report(
      errors,
      Array.isArray(timing) && timing.length > 0 && timing.every((entry) => typeof entry === "number" && Number.isFinite(entry) && entry > 0),
      `Move ${move.slug} must have a non-empty positive numeric timing pattern.`
    );
  }

  for (const companion of companions) {
    report(errors, companionTypes.has(companion.primaryType), `Companion ${companion.slug} uses unknown primary type ${companion.primaryType}.`);
    report(errors, !companion.secondaryType || companionTypes.has(companion.secondaryType), `Companion ${companion.slug} uses unknown secondary type ${companion.secondaryType}.`);
    report(errors, companion.baseHp > 0, `Companion ${companion.slug} must have positive HP.`);
    report(errors, [companion.potency, companion.vigor, companion.speed, companion.resin, companion.terpenes, companion.stability].every((value) => value > 0), `Companion ${companion.slug} has a non-positive combat stat.`);
    report(errors, companion.moves.length > 0, `Companion ${companion.slug} has no moves.`);
    for (const entry of companion.moves) {
      report(errors, moveSlugs.has(entry.moveTemplate.slug), `Companion ${companion.slug} references missing move ${entry.moveTemplate.slug}.`);
      report(errors, entry.levelRequired >= 1, `Companion ${companion.slug} has an invalid move level requirement.`);
    }
  }

  for (const npc of npcs) {
    const party = npc.partyJson;
    report(errors, Array.isArray(party) && party.length > 0, `NPC ${npc.slug} must have a non-empty party.`);
    if (!Array.isArray(party)) continue;
    for (const [index, rawEntry] of party.entries()) {
      if (!isRecord(rawEntry)) {
        errors.push(`NPC ${npc.slug} party entry ${index + 1} is not an object.`);
        continue;
      }
      const templateSlug = rawEntry.templateSlug;
      const level = rawEntry.level;
      report(errors, nonEmptyString(templateSlug) && companionSlugs.has(templateSlug), `NPC ${npc.slug} party entry ${index + 1} references missing companion ${String(templateSlug)}.`);
      report(errors, positiveInteger(level), `NPC ${npc.slug} party entry ${index + 1} has invalid level ${String(level)}.`);
    }
  }

  for (const item of items) {
    report(errors, itemUseContexts.has(item.useContext), `Item ${item.slug} uses unknown context ${item.useContext}.`);
    if (item.kind === "KEY_TOOL") {
      report(errors, !item.stackable, `Key tool ${item.slug} must not be stackable.`);
      report(errors, item.useContext === "MAP", `Key tool ${item.slug} must use the MAP context.`);
    }

    if (!isRecord(item.effectJson)) {
      errors.push(`Item ${item.slug} effect must be an object.`);
      continue;
    }
    const effectType = item.effectJson.type;
    report(errors, nonEmptyString(effectType) && itemEffectTypes.has(effectType), `Item ${item.slug} uses unknown effect type ${String(effectType)}.`);
    if (effectType === "HEAL_HP") {
      report(errors, positiveInteger(item.effectJson.amount), `Healing item ${item.slug} must have a positive integer amount.`);
    }
    if (effectType === "CLEAR_OBSTACLE" || effectType === "REVEAL_PATH") {
      report(errors, nonEmptyString(item.effectJson.requiredTargetTag), `Tool ${item.slug} must define requiredTargetTag.`);
      if (item.effectJson.unlockSlug !== undefined) {
        report(errors, nonEmptyString(item.effectJson.unlockSlug), `Tool ${item.slug} has an invalid optional unlockSlug.`);
      }
    }
  }

  for (const obstacle of obstacles) {
    report(errors, obstacle.requiredItem.kind === "KEY_TOOL", `Obstacle ${obstacle.slug} requires ${obstacle.requiredItem.slug}, which is not a key tool.`);
    report(errors, nonEmptyString(obstacle.regionSlug), `Obstacle ${obstacle.slug} is missing a region.`);
    report(errors, nonEmptyString(obstacle.clearedUnlockSlug), `Obstacle ${obstacle.slug} is missing its cleared unlock slug.`);
  }

  for (const dialogue of dialogues) {
    const nodes = dialogue.nodesJson;
    report(errors, Array.isArray(nodes) && nodes.length > 0, `Dialogue ${dialogue.slug} must contain at least one node.`);
    if (!Array.isArray(nodes)) continue;

    const nodeIds = new Set<string>();
    for (const [index, rawNode] of nodes.entries()) {
      if (!isRecord(rawNode)) {
        errors.push(`Dialogue ${dialogue.slug} node ${index + 1} is not an object.`);
        continue;
      }
      report(errors, nonEmptyString(rawNode.id), `Dialogue ${dialogue.slug} node ${index + 1} has no ID.`);
      report(errors, nonEmptyString(rawNode.text), `Dialogue ${dialogue.slug} node ${index + 1} has no text.`);
      if (nonEmptyString(rawNode.id)) {
        report(errors, !nodeIds.has(rawNode.id), `Dialogue ${dialogue.slug} repeats node ID ${rawNode.id}.`);
        nodeIds.add(rawNode.id);
      }
    }

    for (const rawNode of nodes) {
      if (!isRecord(rawNode) || !Array.isArray(rawNode.choices)) continue;
      for (const rawChoice of rawNode.choices) {
        if (!isRecord(rawChoice)) {
          errors.push(`Dialogue ${dialogue.slug} contains a malformed choice.`);
          continue;
        }
        report(errors, nonEmptyString(rawChoice.label), `Dialogue ${dialogue.slug} contains a choice without a label.`);
        if (nonEmptyString(rawChoice.nextNodeId)) {
          report(errors, nodeIds.has(rawChoice.nextNodeId), `Dialogue ${dialogue.slug} choice points to missing node ${rawChoice.nextNodeId}.`);
        }
        if (nonEmptyString(rawChoice.actionSlug)) {
          const [action, target] = rawChoice.actionSlug.split(":", 2);
          if (action === "start-quest") report(errors, questSlugs.has(target), `Dialogue ${dialogue.slug} starts missing quest ${target}.`);
          else if (action === "start-battle") report(errors, npcSlugs.has(target), `Dialogue ${dialogue.slug} starts battle with missing NPC ${target}.`);
          else errors.push(`Dialogue ${dialogue.slug} uses unsupported action ${rawChoice.actionSlug}.`);
        }
      }
    }
  }

  for (const quest of quests) {
    const steps = quest.stepsJson;
    report(errors, Array.isArray(steps) && steps.length > 0, `Quest ${quest.slug} must have at least one step.`);
    if (Array.isArray(steps)) {
      const stepIds = new Set<string>();
      for (const [index, rawStep] of steps.entries()) {
        if (!isRecord(rawStep)) {
          errors.push(`Quest ${quest.slug} step ${index + 1} is not an object.`);
          continue;
        }
        report(errors, nonEmptyString(rawStep.id), `Quest ${quest.slug} step ${index + 1} has no ID.`);
        report(errors, nonEmptyString(rawStep.label), `Quest ${quest.slug} step ${index + 1} has no label.`);
        report(errors, nonEmptyString(rawStep.actionType) && questActions.has(rawStep.actionType), `Quest ${quest.slug} step ${index + 1} uses invalid action ${String(rawStep.actionType)}.`);
        report(errors, nonEmptyString(rawStep.targetSlug), `Quest ${quest.slug} step ${index + 1} has no target.`);
        if (nonEmptyString(rawStep.id)) {
          report(errors, !stepIds.has(rawStep.id), `Quest ${quest.slug} repeats step ID ${rawStep.id}.`);
          stepIds.add(rawStep.id);
        }
        if (!nonEmptyString(rawStep.actionType) || !nonEmptyString(rawStep.targetSlug)) continue;
        if (rawStep.actionType === "TALK" || rawStep.actionType === "RETURN") report(errors, dialogueSlugs.has(rawStep.targetSlug), `Quest ${quest.slug} references missing dialogue ${rawStep.targetSlug}.`);
        if (rawStep.actionType === "PICKUP") report(errors, itemSlugs.has(rawStep.targetSlug), `Quest ${quest.slug} references missing item ${rawStep.targetSlug}.`);
        if (rawStep.actionType === "USE_TOOL") report(errors, obstacleSlugs.has(rawStep.targetSlug), `Quest ${quest.slug} references missing obstacle ${rawStep.targetSlug}.`);
        if (rawStep.actionType === "BATTLE_WIN") report(errors, npcSlugs.has(rawStep.targetSlug), `Quest ${quest.slug} references missing NPC ${rawStep.targetSlug}.`);
        if (rawStep.actionType === "RECRUIT") report(errors, recruitSlugs.has(rawStep.targetSlug), `Quest ${quest.slug} references missing recruit event ${rawStep.targetSlug}.`);
      }
    }

    if (!isRecord(quest.rewardsJson)) {
      errors.push(`Quest ${quest.slug} rewards must be an object.`);
      continue;
    }
    const itemRewards = quest.rewardsJson.itemSlugs;
    if (itemRewards !== undefined) {
      report(errors, Array.isArray(itemRewards) && itemRewards.every((slug) => nonEmptyString(slug) && itemSlugs.has(slug)), `Quest ${quest.slug} contains a missing item reward.`);
    }
    const recruitSlug = quest.rewardsJson.recruitSlug;
    if (recruitSlug !== undefined) report(errors, nonEmptyString(recruitSlug) && recruitSlugs.has(recruitSlug), `Quest ${quest.slug} references missing recruit event ${String(recruitSlug)}.`);
  }

  for (const event of recruitEvents) {
    report(errors, companionSlugs.has(event.companionTemplateSlug), `Recruit event ${event.slug} references missing companion ${event.companionTemplateSlug}.`);
    const requirements = event.requirementsJson;
    report(errors, Array.isArray(requirements) && requirements.length > 0, `Recruit event ${event.slug} must have at least one requirement.`);
    if (!Array.isArray(requirements)) continue;
    for (const [index, rawRequirement] of requirements.entries()) {
      if (!isRecord(rawRequirement)) {
        errors.push(`Recruit event ${event.slug} requirement ${index + 1} is not an object.`);
        continue;
      }
      const type = rawRequirement.type;
      const slug = rawRequirement.slug;
      report(errors, nonEmptyString(type) && recruitRequirementTypes.has(type), `Recruit event ${event.slug} requirement ${index + 1} uses invalid type ${String(type)}.`);
      report(errors, nonEmptyString(slug), `Recruit event ${event.slug} requirement ${index + 1} has no slug.`);
      if (!nonEmptyString(type) || !nonEmptyString(slug)) continue;
      if (type === "QUEST_CLAIMED") report(errors, questSlugs.has(slug), `Recruit event ${event.slug} references missing quest ${slug}.`);
      if (type === "BATTLE_WON") report(errors, npcSlugs.has(slug), `Recruit event ${event.slug} references missing NPC ${slug}.`);
      if (type === "ITEM_OWNED") report(errors, itemSlugs.has(slug), `Recruit event ${event.slug} references missing item ${slug}.`);
    }
  }

  for (const savePoint of savePoints) {
    report(errors, nonEmptyString(savePoint.regionSlug), `Save point ${savePoint.slug} is missing a region.`);
    report(errors, nonEmptyString(savePoint.unlockSlug), `Save point ${savePoint.slug} is missing an unlock slug.`);
  }

  if (errors.length > 0) {
    throw new Error(`Game data validation failed with ${errors.length} error(s):\n- ${errors.join("\n- ")}`);
  }

  console.log(
    `Game data valid: ${companions.length} companions, ${moves.length} moves, ${npcs.length} NPCs, ${items.length} items, ${quests.length} quests, ${recruitEvents.length} recruit events.`
  );
}

validateGameData()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
