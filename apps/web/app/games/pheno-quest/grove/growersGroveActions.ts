import { gameApi } from "../../../components/gameApi";

export type GroveActionResponse = {
  result?: {
    success?: boolean;
    message?: string;
    unlockedSlug?: string;
    grantedItemSlug?: string;
  };
  message?: string;
  navigateTo?: string;
};

export type GroveEntityAction = (playerId: string) => Promise<GroveActionResponse>;

type InteractionResponse = {
  result: {
    success: boolean;
    message: string;
    unlockedSlug?: string;
    grantedItemSlug?: string;
  };
};

type QuestResponse = {
  quest?: unknown;
  message: string;
};

type RecruitmentResponse = {
  success: boolean;
  message: string;
};

type SavePointResponse = {
  success: boolean;
  message: string;
  saveState: {
    lastSavePointSlug?: string | null;
    lastSavedAt?: string | null;
  };
};

type BattleStartResponse = {
  id: string;
};

export function getGrowersGroveAction(slug: string): GroveEntityAction {
  if (slug === "garden-keeper-intro") return (playerId) => talkToGardenKeeper(playerId);
  if (slug === "terp-tonic") return (playerId) => pickup(playerId, "terp-tonic", 1);
  if (slug === "grinder-relic") return (playerId) => pickupAndAdvance(playerId, "grinder-relic");
  if (slug === "vapor-lens") return (playerId) => pickup(playerId, "vapor-lens", 1);
  if (slug === "resin-wall-grove") return (playerId) => useToolAndAdvance(playerId, "grinder-relic", "resin-wall-grove");
  if (slug === "smoke-path-grove") return (playerId) => useTool(playerId, "vapor-lens", "smoke-path-grove");
  if (slug === "growers-grove-cure-station") return (playerId) => saveAtCureStation(playerId);
  if (slug === "rival-grower-ashtray") return (playerId) => startRivalBattle(playerId);
  return async () => ({ message: "Nothing happened." });
}

async function talkToGardenKeeper(playerId: string): Promise<QuestResponse> {
  await gameApi("/dialogue/garden-keeper-intro");
  await gameApi<QuestResponse>("/quests/start", {
    method: "POST",
    body: JSON.stringify({ playerId, questSlug: "clear-resin-wall" })
  });

  const talkResult = await gameApi<QuestResponse>("/quests/advance", {
    method: "POST",
    body: JSON.stringify({ playerId, questSlug: "clear-resin-wall", actionType: "TALK", targetSlug: "garden-keeper-intro" })
  });

  const returnResult = await gameApi<QuestResponse>("/quests/advance", {
    method: "POST",
    body: JSON.stringify({ playerId, questSlug: "clear-resin-wall", actionType: "RETURN", targetSlug: "garden-keeper-intro" })
  });

  if (returnResult.message.includes("completed")) {
    const claim = await gameApi<QuestResponse>("/quests/claim", {
      method: "POST",
      body: JSON.stringify({ playerId, questSlug: "clear-resin-wall" })
    });
    const recruit = await tryRecruitSkunkScout(playerId);
    return recruit ? { message: `${claim.message} ${recruit.message}` } : { message: `${claim.message} Rest at the Cure Station, then defeat Ashtray.` };
  }

  if (talkResult.message === "Quest reward already claimed." || returnResult.message === "Quest reward already claimed.") {
    const recruit = await tryRecruitSkunkScout(playerId);
    return recruit
      ? { message: recruit.message }
      : { message: "Nugsworth: The trail is open. Rest at the Cure Station, defeat Ashtray, then return to me." };
  }

  return returnResult.message.startsWith("Current quest step") ? returnResult : talkResult;
}

async function tryRecruitSkunkScout(playerId: string): Promise<RecruitmentResponse | null> {
  try {
    return await gameApi<RecruitmentResponse>("/recruitment/recruit", {
      method: "POST",
      body: JSON.stringify({ playerId, recruitSlug: "recruit-skunk-scout" })
    });
  } catch {
    return null;
  }
}

async function pickup(playerId: string, itemSlug: string, quantity: number): Promise<InteractionResponse> {
  return gameApi<InteractionResponse>("/inventory/pickup", {
    method: "POST",
    body: JSON.stringify({ playerId, itemSlug, quantity })
  });
}

async function pickupAndAdvance(playerId: string, itemSlug: string): Promise<QuestResponse> {
  const item = await pickup(playerId, itemSlug, 1);
  const quest = await gameApi<QuestResponse>("/quests/advance", {
    method: "POST",
    body: JSON.stringify({ playerId, questSlug: "clear-resin-wall", actionType: "PICKUP", targetSlug: itemSlug })
  });
  return { message: `${item.result.message} ${quest.message}` };
}

async function useTool(playerId: string, toolSlug: string, obstacleSlug: string): Promise<InteractionResponse> {
  return gameApi<InteractionResponse>("/interactions/use-tool", {
    method: "POST",
    body: JSON.stringify({ playerId, toolSlug, obstacleSlug })
  });
}

async function useToolAndAdvance(playerId: string, toolSlug: string, obstacleSlug: string): Promise<QuestResponse> {
  const action = await useTool(playerId, toolSlug, obstacleSlug);
  const quest = await gameApi<QuestResponse>("/quests/advance", {
    method: "POST",
    body: JSON.stringify({ playerId, questSlug: "clear-resin-wall", actionType: "USE_TOOL", targetSlug: obstacleSlug })
  });
  return { message: `${action.result.message} ${quest.message}` };
}

async function saveAtCureStation(playerId: string): Promise<SavePointResponse> {
  return gameApi<SavePointResponse>("/savepoints/use", {
    method: "POST",
    body: JSON.stringify({ playerId, savePointSlug: "growers-grove-cure-station" })
  });
}

async function startRivalBattle(playerId: string): Promise<GroveActionResponse> {
  const battle = await gameApi<BattleStartResponse>("/battles/start", {
    method: "POST",
    body: JSON.stringify({ playerId, npcSlug: "rival-grower-ashtray" })
  });
  const params = new URLSearchParams({
    battleId: battle.id,
    playerId,
    returnTo: "/games/pheno-quest/grove"
  });
  return {
    message: "Ashtray accepted the challenge. Entering battle…",
    navigateTo: `/games/pheno-quest?${params.toString()}`
  };
}
