export interface SavePointTemplateView {
  slug: string;
  name: string;
  regionSlug: string;
  description: string;
  recoveryType: "PARTY_RECOVER" | "SAVE_ONLY";
  unlockSlug: string;
}

export interface PlayerSaveStateView {
  playerId: string;
  activeRegionSlug?: string | null;
  lastSavePointSlug?: string | null;
  lastSavedAt?: string | null;
  visitedSavePointSlugs: string[];
}

export interface SavePointUseResult {
  success: boolean;
  message: string;
  savePoint: SavePointTemplateView;
  saveState: PlayerSaveStateView;
}
