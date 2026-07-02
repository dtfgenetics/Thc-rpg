import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { z } from "zod";
import { health } from "./health.js";
import {
  activateAwakening,
  ensureDevPlayer,
  getBattleState,
  getPlayerSummary,
  resolvePlayerTurn,
  startBattle
} from "./services/battleEngine.js";
import { getPlayerInventory, grantItem, useConsumable, useToolOnObstacle } from "./services/inventoryEngine.js";
import { addCompanionToParty, getPartyState, removeCompanionFromParty, swapPartyPositions } from "./services/partyEngine.js";
import {
  advanceQuest,
  claimQuest,
  getDialogue,
  getPlayerQuests,
  getRecruitEvents,
  recruitCompanion,
  startQuest
} from "./services/progressionEngine.js";
import { getPlayerSaveState, getRegionSavePoints, useSavePoint } from "./services/savePointEngine.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json(health);
});

app.post("/dev/player", async (request, response, next) => {
  try {
    const schema = z.object({ handle: z.string().min(2).max(40).optional() });
    const body = schema.parse(request.body ?? {});
    const player = await ensureDevPlayer(body.handle);
    const summary = await getPlayerSummary(player.id);
    response.json(summary);
  } catch (error) {
    next(error);
  }
});

app.get("/players/:playerId", async (request, response, next) => {
  try {
    const player = await getPlayerSummary(request.params.playerId);
    response.json(player);
  } catch (error) {
    next(error);
  }
});

app.get("/party/:playerId", async (request, response, next) => {
  try {
    const party = await getPartyState(request.params.playerId);
    response.json(party);
  } catch (error) {
    next(error);
  }
});

app.post("/party/add", async (request, response, next) => {
  try {
    const schema = z.object({ playerId: z.string().min(1), companionId: z.string().min(1) });
    const body = schema.parse(request.body);
    const result = await addCompanionToParty(body.playerId, body.companionId);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/party/remove", async (request, response, next) => {
  try {
    const schema = z.object({ playerId: z.string().min(1), companionId: z.string().min(1) });
    const body = schema.parse(request.body);
    const result = await removeCompanionFromParty(body.playerId, body.companionId);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/party/swap", async (request, response, next) => {
  try {
    const schema = z.object({
      playerId: z.string().min(1),
      firstCompanionId: z.string().min(1),
      secondCompanionId: z.string().min(1)
    });
    const body = schema.parse(request.body);
    const result = await swapPartyPositions(body.playerId, body.firstCompanionId, body.secondCompanionId);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/savepoints/player/:playerId", async (request, response, next) => {
  try {
    const saveState = await getPlayerSaveState(request.params.playerId);
    response.json(saveState);
  } catch (error) {
    next(error);
  }
});

app.get("/savepoints/region/:regionSlug", async (request, response, next) => {
  try {
    const savePoints = await getRegionSavePoints(request.params.regionSlug);
    response.json({ savePoints });
  } catch (error) {
    next(error);
  }
});

app.post("/savepoints/use", async (request, response, next) => {
  try {
    const schema = z.object({ playerId: z.string().min(1), savePointSlug: z.string().min(1) });
    const body = schema.parse(request.body);
    const result = await useSavePoint(body.playerId, body.savePointSlug);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/dialogue/:dialogueSlug", async (request, response, next) => {
  try {
    const dialogue = await getDialogue(request.params.dialogueSlug);
    response.json(dialogue);
  } catch (error) {
    next(error);
  }
});

app.get("/quests/:playerId", async (request, response, next) => {
  try {
    const quests = await getPlayerQuests(request.params.playerId);
    response.json({ quests });
  } catch (error) {
    next(error);
  }
});

app.post("/quests/start", async (request, response, next) => {
  try {
    const schema = z.object({ playerId: z.string().min(1), questSlug: z.string().min(1) });
    const body = schema.parse(request.body);
    const quest = await startQuest(body.playerId, body.questSlug);
    response.json({ quest, message: `${quest.quest.name} started.` });
  } catch (error) {
    next(error);
  }
});

app.post("/quests/advance", async (request, response, next) => {
  try {
    const schema = z.object({
      playerId: z.string().min(1),
      questSlug: z.string().min(1),
      actionType: z.enum(["TALK", "PICKUP", "USE_TOOL", "BATTLE_WIN", "RETURN", "RECRUIT"]),
      targetSlug: z.string().min(1)
    });
    const body = schema.parse(request.body);
    const result = await advanceQuest(body);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/quests/claim", async (request, response, next) => {
  try {
    const schema = z.object({ playerId: z.string().min(1), questSlug: z.string().min(1) });
    const body = schema.parse(request.body);
    const result = await claimQuest(body.playerId, body.questSlug);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/recruitment/:playerId", async (request, response, next) => {
  try {
    const recruitEvents = await getRecruitEvents(request.params.playerId);
    response.json({ recruitEvents });
  } catch (error) {
    next(error);
  }
});

app.post("/recruitment/recruit", async (request, response, next) => {
  try {
    const schema = z.object({ playerId: z.string().min(1), recruitSlug: z.string().min(1) });
    const body = schema.parse(request.body);
    const result = await recruitCompanion(body.playerId, body.recruitSlug);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/inventory/:playerId", async (request, response, next) => {
  try {
    const inventory = await getPlayerInventory(request.params.playerId);
    response.json(inventory);
  } catch (error) {
    next(error);
  }
});

app.post("/inventory/pickup", async (request, response, next) => {
  try {
    const schema = z.object({
      playerId: z.string().min(1),
      itemSlug: z.string().min(1),
      quantity: z.number().int().min(1).max(99).optional()
    });
    const body = schema.parse(request.body);
    const result = await grantItem(body.playerId, body.itemSlug, body.quantity ?? 1);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/inventory/use", async (request, response, next) => {
  try {
    const schema = z.object({
      playerId: z.string().min(1),
      itemSlug: z.string().min(1),
      targetCompanionId: z.string().min(1).optional()
    });
    const body = schema.parse(request.body);
    const result = await useConsumable(body.playerId, body.itemSlug, body.targetCompanionId);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/interactions/use-tool", async (request, response, next) => {
  try {
    const schema = z.object({
      playerId: z.string().min(1),
      obstacleSlug: z.string().min(1),
      toolSlug: z.string().min(1)
    });
    const body = schema.parse(request.body);
    const result = await useToolOnObstacle(body.playerId, body.obstacleSlug, body.toolSlug);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/battles/start", async (request, response, next) => {
  try {
    const schema = z.object({
      playerId: z.string().min(1),
      npcSlug: z.string().min(1).optional()
    });
    const body = schema.parse(request.body);
    const battle = await startBattle(body.playerId, body.npcSlug);
    response.json(battle);
  } catch (error) {
    next(error);
  }
});

app.get("/battles/:battleId", async (request, response, next) => {
  try {
    const battle = await getBattleState(request.params.battleId);
    response.json(battle);
  } catch (error) {
    next(error);
  }
});

app.post("/battles/:battleId/turn", async (request, response, next) => {
  try {
    const schema = z.object({
      playerId: z.string().min(1),
      actorId: z.string().min(1),
      targetId: z.string().min(1),
      moveSlug: z.string().min(1),
      timing: z.object({
        grade: z.enum(["MISS", "GOOD", "PERFECT"]),
        hitCount: z.number().int().min(0).max(10)
      })
    });
    const body = schema.parse(request.body);
    const battle = await resolvePlayerTurn({
      battleId: request.params.battleId,
      playerId: body.playerId,
      actorId: body.actorId,
      targetId: body.targetId,
      moveSlug: body.moveSlug,
      timing: body.timing
    });
    response.json(battle);
  } catch (error) {
    next(error);
  }
});

app.post("/battles/:battleId/awaken", async (request, response, next) => {
  try {
    const schema = z.object({
      playerId: z.string().min(1),
      actorId: z.string().min(1)
    });
    const body = schema.parse(request.body);
    const battle = await activateAwakening(request.params.battleId, body.playerId, body.actorId);
    response.json(battle);
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unknown server error";
  const status = message.includes("not") || message.includes("does not") ? 404 : 400;
  response.status(status).json({ error: message });
});

app.listen(port, () => {
  console.log(`THC: Pheno Quest API running on http://localhost:${port}`);
});
