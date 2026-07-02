import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const moves = [
  {
    slug: "basic-strike",
    name: "Basic Strike",
    type: "HYBRID",
    kind: "DAMAGE" as const,
    basePower: 18,
    accuracy: 100,
    meterGain: 8,
    timingPattern: [500],
    goodBonusCap: 0.12,
    perfectBonusCap: 0.25
  },
  {
    slug: "mango-rush",
    name: "Mango Rush",
    type: "FRUIT",
    kind: "DAMAGE" as const,
    basePower: 28,
    accuracy: 95,
    meterGain: 12,
    timingPattern: [400, 750, 1100],
    goodBonusCap: 0.15,
    perfectBonusCap: 0.35
  },
  {
    slug: "resin-guard",
    name: "Resin Guard",
    type: "HYBRID",
    kind: "SHIELD" as const,
    basePower: 0,
    accuracy: 100,
    meterGain: 12,
    timingPattern: [600],
    goodBonusCap: 0.15,
    perfectBonusCap: 0.35,
    statusEffect: "SHIELD"
  },
  {
    slug: "diesel-flash",
    name: "Diesel Flash",
    type: "GAS",
    kind: "DAMAGE" as const,
    basePower: 34,
    accuracy: 88,
    meterGain: 14,
    timingPattern: [300, 620, 940],
    goodBonusCap: 0.18,
    perfectBonusCap: 0.4
  },
  {
    slug: "purple-lock",
    name: "Purple Lock",
    type: "PURPLE",
    kind: "DEBUFF" as const,
    basePower: 16,
    accuracy: 92,
    meterGain: 13,
    timingPattern: [500, 950],
    goodBonusCap: 0.12,
    perfectBonusCap: 0.3,
    statusEffect: "DROWSY"
  },
  {
    slug: "skunk-swipe",
    name: "Skunk Swipe",
    type: "GAS",
    kind: "DAMAGE" as const,
    basePower: 20,
    accuracy: 94,
    meterGain: 9,
    timingPattern: [500, 900],
    goodBonusCap: 0.12,
    perfectBonusCap: 0.28
  },
  {
    slug: "kush-crush",
    name: "Kush Crush",
    type: "INDICA",
    kind: "DAMAGE" as const,
    basePower: 30,
    accuracy: 90,
    meterGain: 11,
    timingPattern: [450, 850],
    goodBonusCap: 0.15,
    perfectBonusCap: 0.32
  }
];

const companions = [
  {
    slug: "blue-mango",
    name: "Blue Mango",
    primaryType: "HYBRID",
    secondaryType: "FRUIT",
    role: "Balanced attacker-support",
    baseHp: 112,
    potency: 21,
    vigor: 18,
    speed: 17,
    resin: 18,
    terpenes: 23,
    stability: 19,
    awakeningName: "Keeper Pheno",
    starter: true,
    moveSlugs: ["basic-strike", "mango-rush", "resin-guard"]
  },
  {
    slug: "sour-diesel",
    name: "Sour Diesel",
    primaryType: "SATIVA",
    secondaryType: "GAS",
    role: "Fast striker",
    baseHp: 96,
    potency: 25,
    vigor: 14,
    speed: 26,
    resin: 15,
    terpenes: 19,
    stability: 15,
    awakeningName: "Turbo Pheno",
    starter: true,
    moveSlugs: ["basic-strike", "diesel-flash"]
  },
  {
    slug: "granddaddy-purple",
    name: "Granddaddy Purple",
    primaryType: "INDICA",
    secondaryType: "PURPLE",
    role: "Tank / debuffer",
    baseHp: 128,
    potency: 18,
    vigor: 25,
    speed: 11,
    resin: 23,
    terpenes: 17,
    stability: 24,
    awakeningName: "Royal Pheno",
    starter: true,
    moveSlugs: ["basic-strike", "purple-lock"]
  },
  {
    slug: "skunk-scout",
    name: "Skunk Scout",
    primaryType: "GAS",
    secondaryType: null,
    role: "Enemy striker / recruitable scout",
    baseHp: 84,
    potency: 18,
    vigor: 13,
    speed: 18,
    resin: 12,
    terpenes: 14,
    stability: 12,
    awakeningName: "Sharp Stink",
    starter: false,
    moveSlugs: ["skunk-swipe", "basic-strike"]
  },
  {
    slug: "kush-bruiser",
    name: "Kush Bruiser",
    primaryType: "INDICA",
    secondaryType: null,
    role: "Enemy tank",
    baseHp: 120,
    potency: 20,
    vigor: 22,
    speed: 10,
    resin: 18,
    terpenes: 12,
    stability: 18,
    awakeningName: "Couch Lock",
    starter: false,
    moveSlugs: ["kush-crush", "basic-strike"]
  }
];

const items = [
  {
    slug: "terp-tonic",
    name: "Terp Tonic",
    kind: "CONSUMABLE" as const,
    description: "A small restorative item used from the menu in later builds.",
    stackable: true,
    useContext: "MENU",
    effectJson: { type: "HEAL_HP", amount: 30 }
  },
  {
    slug: "grinder-relic",
    name: "Grinder Relic",
    kind: "KEY_TOOL" as const,
    description: "A key tool that breaks brittle resin walls in Grower's Grove.",
    stackable: false,
    useContext: "MAP",
    effectJson: { type: "CLEAR_OBSTACLE", requiredTargetTag: "BRITTLE_RESIN", unlockSlug: "cleared:resin-wall-grove" }
  },
  {
    slug: "vapor-lens",
    name: "Vapor Lens",
    kind: "KEY_TOOL" as const,
    description: "A key tool that reveals hidden smoke paths.",
    stackable: false,
    useContext: "MAP",
    effectJson: { type: "REVEAL_PATH", requiredTargetTag: "SMOKE_PATH", unlockSlug: "cleared:smoke-path-grove" }
  },
  {
    slug: "trimmer-blade",
    name: "Trimmer Blade",
    kind: "KEY_TOOL" as const,
    description: "A key tool used to clear overgrown vine gates.",
    stackable: false,
    useContext: "MAP",
    effectJson: { type: "CLEAR_OBSTACLE", requiredTargetTag: "OVERGROWTH" }
  }
];

const obstacles = [
  {
    slug: "resin-wall-grove",
    name: "Brittle Resin Wall",
    regionSlug: "growers-grove",
    description: "A hardened resin wall blocks a shortcut in Grower's Grove.",
    requiredItemSlug: "grinder-relic",
    clearedUnlockSlug: "cleared:resin-wall-grove"
  },
  {
    slug: "smoke-path-grove",
    name: "Hidden Smoke Path",
    regionSlug: "growers-grove",
    description: "A strange smoke veil hides a path deeper into the grove.",
    requiredItemSlug: "vapor-lens",
    clearedUnlockSlug: "cleared:smoke-path-grove"
  }
];

const dialogues = [
  {
    slug: "garden-keeper-intro",
    title: "Garden Keeper Briefing",
    speakerName: "Garden Keeper Nugsworth",
    regionSlug: "growers-grove",
    nodesJson: [
      {
        id: "start",
        speakerName: "Garden Keeper Nugsworth",
        speakerKind: "NPC",
        text: "Seed Man, the Grove is locking up. Brittle resin is blocking the trail, and the smoke path is hiding our way forward.",
        choices: [{ label: "What do I need?", nextNodeId: "tools" }]
      },
      {
        id: "tools",
        speakerName: "Garden Keeper Nugsworth",
        speakerKind: "NPC",
        text: "Find the Grinder Relic, clear the Resin Wall, then come back. If the Grove accepts you, a wild Skunk Scout may join your crew.",
        choices: [{ label: "Start quest", actionSlug: "start-quest:clear-resin-wall" }]
      }
    ]
  },
  {
    slug: "rival-ashtray-challenge",
    title: "Rival Grower Challenge",
    speakerName: "Rival Grower Ashtray",
    regionSlug: "growers-grove",
    nodesJson: [
      {
        id: "start",
        speakerName: "Rival Grower Ashtray",
        speakerKind: "NPC",
        text: "Seed Man, you cleared a wall and suddenly think you run the Grove? Bring those strain companions and prove it.",
        choices: [{ label: "Battle", actionSlug: "start-battle:rival-grower-ashtray" }]
      }
    ]
  }
];

const quests = [
  {
    slug: "clear-resin-wall",
    name: "Clear the Resin Wall",
    description: "Help Garden Keeper Nugsworth reopen the Grower’s Grove trail by finding the Grinder Relic and clearing the brittle resin wall.",
    regionSlug: "growers-grove",
    stepsJson: [
      { id: "talk-nugsworth", label: "Talk to Garden Keeper Nugsworth", actionType: "TALK", targetSlug: "garden-keeper-intro" },
      { id: "collect-grinder", label: "Pick up the Grinder Relic", actionType: "PICKUP", targetSlug: "grinder-relic" },
      { id: "clear-wall", label: "Use Grinder Relic on Brittle Resin Wall", actionType: "USE_TOOL", targetSlug: "resin-wall-grove" },
      { id: "return-nugsworth", label: "Return to Garden Keeper Nugsworth", actionType: "RETURN", targetSlug: "garden-keeper-intro" }
    ],
    rewardsJson: {
      xp: 25,
      kushCoin: 25,
      reputation: 3,
      unlockSlugs: ["quest:clear-resin-wall:claimed"],
      recruitSlug: "recruit-skunk-scout"
    }
  }
];

const recruitEvents = [
  {
    slug: "recruit-skunk-scout",
    companionTemplateSlug: "skunk-scout",
    displayName: "Recruit Skunk Scout",
    description: "After Seed Man proves himself in Grower’s Grove, a Skunk Scout agrees to join the party.",
    requirementsJson: [{ type: "QUEST_CLAIMED", slug: "clear-resin-wall" }],
    rewardText: "Skunk Scout joined Seed Man’s crew."
  }
];

const savePoints = [
  {
    slug: "growers-grove-cure-station",
    name: "Grower’s Grove Cure Station",
    regionSlug: "growers-grove",
    description: "A warm clone-dome recovery station where Seed Man can rest, save, and reset before the next grow-world challenge.",
    recoveryType: "PARTY_RECOVER",
    unlockSlug: "savepoint:growers-grove-cure-station"
  }
];

async function main() {
  for (const move of moves) {
    await prisma.moveTemplate.upsert({
      where: { slug: move.slug },
      update: move,
      create: move
    });
  }

  for (const companion of companions) {
    const { moveSlugs, ...templateData } = companion;
    const savedTemplate = await prisma.companionTemplate.upsert({
      where: { slug: companion.slug },
      update: templateData,
      create: templateData
    });

    for (const moveSlug of moveSlugs) {
      const move = await prisma.moveTemplate.findUniqueOrThrow({ where: { slug: moveSlug } });
      await prisma.templateMove.upsert({
        where: {
          companionTemplateId_moveTemplateId: {
            companionTemplateId: savedTemplate.id,
            moveTemplateId: move.id
          }
        },
        update: {},
        create: {
          companionTemplateId: savedTemplate.id,
          moveTemplateId: move.id,
          levelRequired: 1
        }
      });
    }
  }

  await prisma.npcTemplate.upsert({
    where: { slug: "rival-grower-ashtray" },
    update: {
      name: "Rival Grower Ashtray",
      partyJson: [
        { templateSlug: "skunk-scout", level: 1 },
        { templateSlug: "kush-bruiser", level: 1 }
      ]
    },
    create: {
      slug: "rival-grower-ashtray",
      name: "Rival Grower Ashtray",
      partyJson: [
        { templateSlug: "skunk-scout", level: 1 },
        { templateSlug: "kush-bruiser", level: 1 }
      ]
    }
  });

  for (const item of items) {
    await prisma.itemTemplate.upsert({
      where: { slug: item.slug },
      update: item,
      create: item
    });
  }

  for (const obstacle of obstacles) {
    await prisma.mapObstacleTemplate.upsert({
      where: { slug: obstacle.slug },
      update: obstacle,
      create: obstacle
    });
  }

  for (const dialogue of dialogues) {
    await prisma.dialogueTemplate.upsert({
      where: { slug: dialogue.slug },
      update: dialogue,
      create: dialogue
    });
  }

  for (const quest of quests) {
    await prisma.questTemplate.upsert({
      where: { slug: quest.slug },
      update: quest,
      create: quest
    });
  }

  for (const recruitEvent of recruitEvents) {
    await prisma.recruitEvent.upsert({
      where: { slug: recruitEvent.slug },
      update: recruitEvent,
      create: recruitEvent
    });
  }

  for (const savePoint of savePoints) {
    await prisma.savePointTemplate.upsert({
      where: { slug: savePoint.slug },
      update: savePoint,
      create: savePoint
    });
  }

  console.log("Seeded THC: Pheno Quest data, Grower's Grove quest, recruitment, and save point.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
