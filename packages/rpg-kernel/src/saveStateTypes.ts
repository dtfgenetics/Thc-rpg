import type { InventoryStackView } from "./itemTypes.js";

export interface PlayerProgressState {
  playerId: string;
  inventory: InventoryStackView[];
  unlockSlugs: string[];
  activeRegionSlug?: string;
  lastSaveAt: string;
}

export interface UnlockView {
  slug: string;
  source: string;
  createdAt: string;
}
