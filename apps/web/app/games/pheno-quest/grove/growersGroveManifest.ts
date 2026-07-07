export type GroveEntityKind = "ITEM" | "OBSTACLE" | "NPC" | "SAVE_POINT" | "BATTLE_TRIGGER";

export interface GroveEntityDefinition {
  slug: string;
  kind: GroveEntityKind;
  label: string;
  x: number;
  y: number;
  radius: number;
  color?: number;
  hint: string;
}

export const GROWERS_GROVE_REGION_SLUG = "growers-grove";

export const growersGroveEntities: GroveEntityDefinition[] = [
  {
    slug: "garden-keeper-intro",
    kind: "NPC",
    label: "Garden Keeper Nugsworth",
    x: 126,
    y: 350,
    radius: 54,
    color: 0x6da94d,
    hint: "Press E/Space/Interact: Talk to Garden Keeper Nugsworth."
  },
  {
    slug: "terp-tonic",
    kind: "ITEM",
    label: "Terp Tonic",
    x: 170,
    y: 180,
    radius: 36,
    color: 0xf5c84b,
    hint: "Press E/Space/Interact: Pick up Terp Tonic."
  },
  {
    slug: "grinder-relic",
    kind: "ITEM",
    label: "Grinder Relic",
    x: 600,
    y: 175,
    radius: 38,
    color: 0xb88746,
    hint: "Press E/Space/Interact: Pick up Grinder Relic."
  },
  {
    slug: "vapor-lens",
    kind: "ITEM",
    label: "Vapor Lens",
    x: 612,
    y: 340,
    radius: 38,
    color: 0x8fd7ff,
    hint: "Press E/Space/Interact: Pick up Vapor Lens."
  },
  {
    slug: "resin-wall-grove",
    kind: "OBSTACLE",
    label: "Brittle Resin Wall",
    x: 365,
    y: 160,
    radius: 52,
    color: 0xcc8a31,
    hint: "Press E/Space/Interact: Use Grinder Relic on Resin Wall."
  },
  {
    slug: "smoke-path-grove",
    kind: "OBSTACLE",
    label: "Hidden Smoke Path",
    x: 365,
    y: 350,
    radius: 56,
    color: 0xdad7ff,
    hint: "Press E/Space/Interact: Use Vapor Lens on Smoke Path."
  },
  {
    slug: "growers-grove-cure-station",
    kind: "SAVE_POINT",
    label: "Cure Station",
    x: 430,
    y: 260,
    radius: 54,
    hint: "Press E/Space/Interact: Rest at Grower’s Grove Cure Station."
  },
  {
    slug: "rival-grower-ashtray",
    kind: "BATTLE_TRIGGER",
    label: "Rival Grower Ashtray",
    x: 665,
    y: 260,
    radius: 54,
    color: 0x5d3a24,
    hint: "Press E/Space/Interact: Challenge Rival Grower Ashtray."
  }
];
