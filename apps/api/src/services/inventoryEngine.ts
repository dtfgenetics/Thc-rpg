import type { InteractionResult, InventoryStackView, ItemEffect, ItemKind, ItemTemplateView, UnlockView } from "@thc/rpg-kernel";
import { prisma } from "../prismaClient.js";

function toItemView(item: {
  slug: string;
  name: string;
  kind: string;
  description: string;
  stackable: boolean;
  useContext: string;
  effectJson: unknown;
}): ItemTemplateView {
  return {
    slug: item.slug,
    name: item.name,
    kind: item.kind as ItemKind,
    description: item.description,
    stackable: item.stackable,
    useContext: item.useContext as ItemTemplateView["useContext"],
    effect: item.effectJson as ItemEffect
  };
}

export async function getPlayerInventory(playerId: string): Promise<{
  inventory: InventoryStackView[];
  unlocks: UnlockView[];
}> {
  await prisma.player.findUniqueOrThrow({ where: { id: playerId } });

  const [inventoryRows, unlockRows] = await Promise.all([
    prisma.playerInventoryItem.findMany({
      where: { playerId },
      orderBy: { item: { name: "asc" } },
      include: { item: true }
    }),
    prisma.playerUnlock.findMany({
      where: { playerId },
      orderBy: { createdAt: "asc" }
    })
  ]);

  return {
    inventory: inventoryRows.map((row) => ({
      item: toItemView(row.item),
      quantity: row.quantity
    })),
    unlocks: unlockRows.map((row) => ({
      slug: row.slug,
      source: row.source,
      createdAt: row.createdAt.toISOString()
    }))
  };
}

export async function grantItem(playerId: string, itemSlug: string, quantity = 1): Promise<{
  result: InteractionResult;
  inventory: InventoryStackView[];
  unlocks: UnlockView[];
}> {
  await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  const item = await prisma.itemTemplate.findUniqueOrThrow({ where: { slug: itemSlug } });
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const quantityToAdd = item.stackable ? safeQuantity : 1;

  const existing = await prisma.playerInventoryItem.findUnique({
    where: {
      playerId_itemId: {
        playerId,
        itemId: item.id
      }
    }
  });

  if (existing) {
    await prisma.playerInventoryItem.update({
      where: { id: existing.id },
      data: {
        quantity: item.stackable ? { increment: quantityToAdd } : 1
      }
    });
  } else {
    await prisma.playerInventoryItem.create({
      data: {
        playerId,
        itemId: item.id,
        quantity: quantityToAdd
      }
    });
  }

  const state = await getPlayerInventory(playerId);
  return {
    result: {
      success: true,
      message: `Picked up ${item.name}.`,
      grantedItemSlug: item.slug
    },
    ...state
  };
}

export async function useConsumable(playerId: string, itemSlug: string): Promise<{
  result: InteractionResult;
  inventory: InventoryStackView[];
  unlocks: UnlockView[];
}> {
  const row = await prisma.playerInventoryItem.findFirst({
    where: {
      playerId,
      item: { slug: itemSlug }
    },
    include: { item: true }
  });

  if (!row || row.quantity <= 0) {
    throw new Error("Player does not own this item.");
  }

  if (row.item.kind === "KEY_TOOL") {
    throw new Error("Key tools are used through map interactions, not consumed.");
  }

  if (row.quantity > 1) {
    await prisma.playerInventoryItem.update({
      where: { id: row.id },
      data: { quantity: { decrement: 1 } }
    });
  } else {
    await prisma.playerInventoryItem.delete({ where: { id: row.id } });
  }

  const effect = row.item.effectJson as ItemEffect;
  const state = await getPlayerInventory(playerId);

  return {
    result: {
      success: true,
      message: `${row.item.name} used. Effect queued: ${effect.type}.`,
      consumedItemSlug: row.item.slug
    },
    ...state
  };
}

export async function useToolOnObstacle(playerId: string, obstacleSlug: string, toolSlug: string): Promise<{
  result: InteractionResult;
  inventory: InventoryStackView[];
  unlocks: UnlockView[];
}> {
  await prisma.player.findUniqueOrThrow({ where: { id: playerId } });

  const obstacle = await prisma.mapObstacleTemplate.findUniqueOrThrow({
    where: { slug: obstacleSlug },
    include: { requiredItem: true }
  });

  if (obstacle.requiredItemSlug !== toolSlug) {
    throw new Error(`${obstacle.name} requires ${obstacle.requiredItem.name}.`);
  }

  const ownedTool = await prisma.playerInventoryItem.findFirst({
    where: {
      playerId,
      item: { slug: toolSlug, kind: "KEY_TOOL" }
    },
    include: { item: true }
  });

  if (!ownedTool || ownedTool.quantity <= 0) {
    throw new Error(`You need ${obstacle.requiredItem.name} to clear ${obstacle.name}.`);
  }

  const unlock = await prisma.playerUnlock.upsert({
    where: {
      playerId_slug: {
        playerId,
        slug: obstacle.clearedUnlockSlug
      }
    },
    update: { source: `tool:${toolSlug}` },
    create: {
      playerId,
      slug: obstacle.clearedUnlockSlug,
      source: `tool:${toolSlug}`
    }
  });

  const state = await getPlayerInventory(playerId);
  return {
    result: {
      success: true,
      message: `${ownedTool.item.name} cleared ${obstacle.name}.`,
      unlockedSlug: unlock.slug
    },
    ...state
  };
}
