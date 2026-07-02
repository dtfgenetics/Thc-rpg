export type InteractionKind =
  | "NPC_DIALOGUE"
  | "ITEM_PICKUP"
  | "TOOL_GATE"
  | "BATTLE_TRIGGER"
  | "REGION_TRANSITION"
  | "SAVE_POINT";

export interface MapObstacleView {
  slug: string;
  name: string;
  regionSlug: string;
  description: string;
  requiredItemSlug: string;
  clearedUnlockSlug: string;
}

export interface InteractionResult {
  success: boolean;
  message: string;
  grantedItemSlug?: string;
  consumedItemSlug?: string;
  unlockedSlug?: string;
  battleSlug?: string;
  regionSlug?: string;
}

export interface ToolUseInput {
  playerId: string;
  obstacleSlug: string;
  toolSlug: string;
}
