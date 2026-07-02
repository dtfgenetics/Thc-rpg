export type RegionBiome =
  | "GROVE"
  | "SUMMIT"
  | "VALLEY"
  | "CAVE"
  | "FOREST"
  | "RUINS"
  | "LAB";

export interface RegionDefinition {
  slug: string;
  name: string;
  biome: RegionBiome;
  description: string;
  requiredUnlockSlug?: string;
  encounterTableSlug?: string;
}

export interface RegionStateView {
  region: RegionDefinition;
  unlocked: boolean;
  clearedObstacleSlugs: string[];
  discoveredItemSlugs: string[];
}
