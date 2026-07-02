export interface RecruitRequirement {
  type: "QUEST_CLAIMED" | "BATTLE_WON" | "UNLOCK" | "ITEM_OWNED";
  slug: string;
}

export interface RecruitEventView {
  slug: string;
  companionTemplateSlug: string;
  displayName: string;
  description: string;
  requirements: RecruitRequirement[];
  rewardText: string;
}

export interface RecruitmentResult {
  success: boolean;
  message: string;
  companionTemplateSlug?: string;
  playerCompanionId?: string;
}
