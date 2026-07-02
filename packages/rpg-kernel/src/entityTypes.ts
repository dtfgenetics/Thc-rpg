export type EntityKind = "SEED_MAN" | "NPC" | "ITEM" | "OBSTACLE" | "BATTLE_TRIGGER" | "REGION_EXIT";

export interface GridPosition {
  x: number;
  y: number;
}

export interface GameEntityView {
  slug: string;
  name: string;
  kind: EntityKind;
  position: GridPosition;
  interactable: boolean;
  interactionSlug?: string;
}

export const SEED_MAN_ENTITY: GameEntityView = {
  slug: "seed-man",
  name: "Seed Man",
  kind: "SEED_MAN",
  position: { x: 2, y: 4 },
  interactable: false
};
