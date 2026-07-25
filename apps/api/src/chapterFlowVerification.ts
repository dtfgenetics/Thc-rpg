import assert from "node:assert/strict";
import { getFirstAlive, type BattleState, type MoveTemplateView } from "@thc/shared";
import { ensureDevPlayer, resolvePlayerTurn, startBattle } from "./services/battleEngine.js";
import { getPlayerInventory, grantItem, useToolOnObstacle } from "./services/inventoryEngine.js";
import { advanceQuest, claimQuest, getRecruitEvents, recruitCompanion, startQuest } from "./services/progressionEngine.js";
import { getPlayerSaveState, useSavePoint } from "./services/savePointEngine.js";
import { prisma } from "./prismaClient.js";

const QUEST_SLUG = "clear-resin-wall";
const NPC_SLUG = "rival-grower-ashtray";
const RECRUIT_SLUG = "recruit-skunk-scout";

function strongestUsableMove(moves: MoveTemplateView[]): MoveTemplateView {
  const candidates = moves
    .filter((move) => !move.awakeningOnly)
    .sort((left, right) => {
      const damagePriority = Number(right.kind === "DAMAGE") - Number(left.kind === "DAMAGE");
      return damagePriority || right.basePower - left.basePower;
    });
  const move = candidates[0];
  if (!move) throw new Error("Active companion has no usable move.");
  return move;
}

async function playBattleToCompletion(initialBattle: BattleState): Promise<BattleState> {
  let battle = initialBattle;

  for (let turn = 0; turn < 100 && battle.status === "ACTIVE"; turn += 1) {
    const actor = getFirstAlive(battle.playerTeam);
    const target = getFirstAlive(battle.enemyTeam);
    assert.ok(actor, "The player party has no living combatant during an active battle.");
    assert.ok(target, "The enemy party has no living combatant during an active battle.");
    const move = strongestUsableMove(actor.moves);

    battle = await resolvePlayerTurn({
      battleId: battle.id,
      playerId: battle.playerId,
      actorId: actor.id,
      targetId: target.id,
      moveSlug: move.slug,
      timing: {
        grade: "PERFECT",
        hitCount: move.timingPattern.length
      }
    });
  }

  assert.notEqual(battle.status, "ACTIVE", "The rival battle exceeded the 100-turn safety limit.");
  return battle;
}

async function verifyChapterFlow(): Promise<void> {
  const handle = `CI Chapter Grower ${Date.now()}`;
  const player = await ensureDevPlayer(handle);

  await assert.rejects(
    () => startBattle(player.id, NPC_SLUG),
    /Clear the Resin Wall quest/,
    "Ashtray battle must remain locked before the chapter quest is claimed."
  );

  await startQuest(player.id, QUEST_SLUG);
  const talked = await advanceQuest({
    playerId: player.id,
    questSlug: QUEST_SLUG,
    actionType: "TALK",
    targetSlug: "garden-keeper-intro"
  });
  assert.equal(talked.quest.currentStepIndex, 1);

  await grantItem(player.id, "grinder-relic", 1);
  const pickedUp = await advanceQuest({
    playerId: player.id,
    questSlug: QUEST_SLUG,
    actionType: "PICKUP",
    targetSlug: "grinder-relic"
  });
  assert.equal(pickedUp.quest.currentStepIndex, 2);

  const clearedWall = await useToolOnObstacle(player.id, "resin-wall-grove", "grinder-relic");
  assert.equal(clearedWall.result.unlockedSlug, "cleared:resin-wall-grove");
  const usedTool = await advanceQuest({
    playerId: player.id,
    questSlug: QUEST_SLUG,
    actionType: "USE_TOOL",
    targetSlug: "resin-wall-grove"
  });
  assert.equal(usedTool.quest.currentStepIndex, 3);

  const returned = await advanceQuest({
    playerId: player.id,
    questSlug: QUEST_SLUG,
    actionType: "RETURN",
    targetSlug: "garden-keeper-intro"
  });
  assert.equal(returned.quest.status, "COMPLETED");

  const claimed = await claimQuest(player.id, QUEST_SLUG);
  assert.equal(claimed.quest.status, "CLAIMED");

  const beforeBattleRecruit = (await getRecruitEvents(player.id)).find((event) => event.slug === RECRUIT_SLUG);
  assert.ok(beforeBattleRecruit);
  assert.equal(beforeBattleRecruit.available, false, "Skunk Scout must not be recruitable before Ashtray is defeated.");

  const cureStation = await useSavePoint(player.id, "growers-grove-cure-station");
  assert.equal(cureStation.success, true);

  const startedBattle = await startBattle(player.id, NPC_SLUG);
  const finishedBattle = await playBattleToCompletion(startedBattle);
  assert.equal(finishedBattle.status, "WON", "The scripted perfect-timing chapter run should defeat Ashtray.");

  const afterBattleRecruit = (await getRecruitEvents(player.id)).find((event) => event.slug === RECRUIT_SLUG);
  assert.ok(afterBattleRecruit);
  assert.equal(afterBattleRecruit.available, true, "Skunk Scout should become available after the quest and Ashtray victory.");

  const recruitment = await recruitCompanion(player.id, RECRUIT_SLUG);
  assert.equal(recruitment.success, true);
  assert.equal(recruitment.companionTemplateSlug, "skunk-scout");

  const inventory = await getPlayerInventory(player.id);
  assert.ok(inventory.inventory.some((stack) => stack.item.slug === "grinder-relic"));
  assert.ok(inventory.unlocks.some((unlock) => unlock.slug === "quest:clear-resin-wall:claimed"));
  assert.ok(inventory.unlocks.some((unlock) => unlock.slug === `battle-won:${NPC_SLUG}`));

  const saveState = await getPlayerSaveState(player.id);
  assert.equal(saveState.activeRegionSlug, "growers-grove");
  assert.equal(saveState.lastSavePointSlug, "growers-grove-cure-station");

  console.log(
    `Chapter flow verified for ${handle}: quest claimed, Resin Wall cleared, Cure Station saved, Ashtray defeated, Skunk Scout recruited.`
  );
}

verifyChapterFlow()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
