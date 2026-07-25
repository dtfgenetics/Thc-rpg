export type ItemKind =
  | "CONSUMABLE"
  | "BATTLE_ITEM"
  | "KEY_TOOL"
  | "RELIC"
  | "GENETICS"
  | "QUEST"
  | "MATERIAL";

export type ItemUseContext = "BATTLE" | "MAP" | "MENU" | "PASSIVE";

export interface ItemEffect {
  type:
    | "HEAL_HP"
    | "GAIN_SHIELD"
    | "CLEAR_OBSTACLE"
    | "REVEAL_PATH"
    | "UNLOCK_REGION"
    | "QUEST_FLAG"
    | "NO_EFFECT";
  amount?: number;
  unlockSlug?: string;
  requiredTargetTag?: string;
}

export interface ItemTemplateView {
  slug: string;
  name: string;
  kind: ItemKind;
  description: string;
  stackable: boolean;
  useContext: ItemUseContext;
  effect: ItemEffect;
}

export interface InventoryStackView {
  item: ItemTemplateView;
  quantity: number;
}

export function isKeyTool(item: ItemTemplateView): boolean {
  return item.kind === "KEY_TOOL";
}

export function canStack(item: ItemTemplateView): boolean {
  return item.stackable && item.kind !== "KEY_TOOL";
}
