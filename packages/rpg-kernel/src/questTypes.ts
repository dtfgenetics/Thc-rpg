export type QuestStatus = "ACTIVE" | "COMPLETED" | "CLAIMED";

export interface QuestStepDefinition {
  id: string;
  label: string;
  actionType: "TALK" | "PICKUP" | "USE_TOOL" | "BATTLE_WIN" | "RETURN" | "RECRUIT";
  targetSlug: string;
}

export interface QuestRewards {
  xp?: number;
  kushCoin?: number;
  reputation?: number;
  itemSlugs?: string[];
  unlockSlugs?: string[];
  recruitSlug?: string;
}

export interface QuestTemplateView {
  slug: string;
  name: string;
  description: string;
  regionSlug?: string | null;
  steps: QuestStepDefinition[];
  rewards: QuestRewards;
}

export interface PlayerQuestView {
  quest: QuestTemplateView;
  status: QuestStatus;
  currentStepIndex: number;
  completedStepIds: string[];
  completedAt?: string | null;
}
