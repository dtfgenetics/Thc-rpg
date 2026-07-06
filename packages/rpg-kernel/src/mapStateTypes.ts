export interface RegionItemStateView {
  slug: string;
  name: string;
  owned: boolean;
  visible: boolean;
}

export interface RegionObstacleStateView {
  slug: string;
  name: string;
  requiredItemSlug: string;
  clearedUnlockSlug: string;
  cleared: boolean;
  visible: boolean;
}

export interface RegionSavePointStateView {
  slug: string;
  name: string;
  visited: boolean;
  active: boolean;
}

export interface RegionQuestStateView {
  slug: string;
  name: string;
  status: "NOT_STARTED" | "ACTIVE" | "COMPLETED" | "CLAIMED";
  currentStepIndex: number;
}

export interface RegionRecruitStateView {
  slug: string;
  displayName: string;
  available: boolean;
  claimed: boolean;
}

export interface RegionMapStateView {
  playerId: string;
  regionSlug: string;
  items: RegionItemStateView[];
  obstacles: RegionObstacleStateView[];
  savePoints: RegionSavePointStateView[];
  quests: RegionQuestStateView[];
  recruits: RegionRecruitStateView[];
  unlockSlugs: string[];
}
