"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type PlayerSummary = {
  id: string;
  handle: string;
};

type InteractionResponse = {
  result: {
    success: boolean;
    message: string;
    unlockedSlug?: string;
    grantedItemSlug?: string;
  };
};

type QuestResponse = {
  quest?: unknown;
  message: string;
};

type RecruitmentResponse = {
  success: boolean;
  message: string;
};

type SavePointResponse = {
  success: boolean;
  message: string;
  saveState: {
    lastSavePointSlug?: string | null;
    lastSavedAt?: string | null;
  };
};

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown API error" }));
    throw new Error(error.error || "API request failed");
  }

  return response.json() as Promise<T>;
}

export default function GrowersGroveGame() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<unknown>(null);
  const playerIdRef = useRef<string | null>(null);
  const [message, setMessage] = useState("Loading Seed Man into Grower’s Grove...");
  const [playerHandle, setPlayerHandle] = useState<string>("");

  useEffect(() => {
    let destroyed = false;

    async function boot() {
      const Phaser = await import("phaser");
      if (destroyed || !mountRef.current || gameRef.current) return;

      const devPlayer = await api<PlayerSummary>("/dev/player", {
        method: "POST",
        body: JSON.stringify({ handle: "DTF Demo Grower" })
      });

      playerIdRef.current = devPlayer.id;
      setPlayerHandle(devPlayer.handle);
      setMessage("Use arrow keys/WASD to move Seed Man. Walk into NPCs, items, obstacles, and the Cure Station.");

      class GrowersGroveScene extends Phaser.Scene {
        private seedMan!: Phaser.GameObjects.Container;
        private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
        private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
        private interactText!: Phaser.GameObjects.Text;
        private actionLocked = false;
        private speed = 170;

        constructor() {
          super("GrowersGroveScene");
        }

        preload() {
          createGeneratedTextures(this);
        }

        create() {
          this.cameras.main.setBackgroundColor("#0d2414");
          this.add.rectangle(400, 260, 760, 460, 0x14351d).setStrokeStyle(4, 0x6da94d);
          this.add.text(28, 24, "Grower’s Grove", { fontSize: "24px", color: "#f4ffe8", fontStyle: "bold" });
          this.add.text(28, 54, "Seed Man tutorial zone — clear the resin wall, save at the Cure Station, and recruit Skunk Scout", {
            fontSize: "14px",
            color: "#bad1b1"
          });

          drawGroveFloor(this);
          drawNpc(this, 126, 350, "garden-keeper-intro", "Garden Keeper Nugsworth", 0x6da94d);
          drawActionObject(this, 170, 180, "terp-tonic", "Terp Tonic", 0xf5c84b);
          drawActionObject(this, 600, 175, "grinder-relic", "Grinder Relic", 0xb88746);
          drawActionObject(this, 612, 340, "vapor-lens", "Vapor Lens", 0x8fd7ff);
          drawObstacle(this, 365, 160, "resin-wall-grove", "Brittle Resin Wall", 0xcc8a31);
          drawObstacle(this, 365, 350, "smoke-path-grove", "Hidden Smoke Path", 0xdad7ff);
          drawSavePoint(this, 430, 260, "growers-grove-cure-station", "Cure Station");
          drawNpc(this, 665, 260, "rival-grower-ashtray", "Rival Grower Ashtray", 0x5d3a24);

          this.seedMan = createSeedMan(this, 90, 260);
          this.cursors = this.input.keyboard!.createCursorKeys();
          this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;

          this.interactText = this.add
            .text(24, 450, "Seed Man is ready. Start with Garden Keeper Nugsworth, then use the Cure Station before battling.", {
              fontSize: "15px",
              color: "#f4ffe8",
              backgroundColor: "#102016",
              padding: { x: 10, y: 8 }
            })
            .setDepth(20);
        }

        update(_time: number, delta: number) {
          const dt = delta / 1000;
          let vx = 0;
          let vy = 0;

          if (this.cursors.left?.isDown || this.wasd.A.isDown) vx -= 1;
          if (this.cursors.right?.isDown || this.wasd.D.isDown) vx += 1;
          if (this.cursors.up?.isDown || this.wasd.W.isDown) vy -= 1;
          if (this.cursors.down?.isDown || this.wasd.S.isDown) vy += 1;

          if (vx !== 0 || vy !== 0) {
            const length = Math.sqrt(vx * vx + vy * vy);
            vx /= length;
            vy /= length;
            this.seedMan.x = Phaser.Math.Clamp(this.seedMan.x + vx * this.speed * dt, 58, 742);
            this.seedMan.y = Phaser.Math.Clamp(this.seedMan.y + vy * this.speed * dt, 110, 410);
          }

          this.checkInteractions();
        }

        private async checkInteractions() {
          if (this.actionLocked) return;

          const x = this.seedMan.x;
          const y = this.seedMan.y;
          const playerId = playerIdRef.current;
          if (!playerId) return;

          if (Phaser.Math.Distance.Between(x, y, 126, 350) < 54) {
            await this.runAction(() => talkToGardenKeeper(playerId), "Garden Keeper Nugsworth gives Seed Man the Grove quest.");
          } else if (Phaser.Math.Distance.Between(x, y, 170, 180) < 36) {
            await this.runAction(() => pickup(playerId, "terp-tonic", 1), "Seed Man picked up a Terp Tonic.");
          } else if (Phaser.Math.Distance.Between(x, y, 600, 175) < 38) {
            await this.runAction(() => pickupAndAdvance(playerId, "grinder-relic"), "Seed Man found the Grinder Relic.");
          } else if (Phaser.Math.Distance.Between(x, y, 612, 340) < 38) {
            await this.runAction(() => pickup(playerId, "vapor-lens", 1), "Seed Man found the Vapor Lens.");
          } else if (Phaser.Math.Distance.Between(x, y, 365, 160) < 52) {
            await this.runAction(
              () => useToolAndAdvance(playerId, "grinder-relic", "resin-wall-grove"),
              "Seed Man used the Grinder Relic on the brittle resin wall."
            );
          } else if (Phaser.Math.Distance.Between(x, y, 365, 350) < 56) {
            await this.runAction(
              () => useTool(playerId, "vapor-lens", "smoke-path-grove"),
              "Seed Man used the Vapor Lens to reveal the smoke path."
            );
          } else if (Phaser.Math.Distance.Between(x, y, 430, 260) < 54) {
            await this.runAction(
              () => saveAtCureStation(playerId),
              "Seed Man rested at the Grower’s Grove Cure Station."
            );
          } else if (Phaser.Math.Distance.Between(x, y, 665, 260) < 54) {
            this.actionLocked = true;
            this.interactText.setText("Rival Grower Ashtray: Meet me on the battle screen, Seed Man.");
            setMessage("Rival battle trigger reached. Use the battle screen to fight Rival Grower Ashtray.");
            this.time.delayedCall(1200, () => {
              this.actionLocked = false;
            });
          }
        }

        private async runAction(action: () => Promise<{ result?: { message?: string }; message?: string }>, fallbackMessage: string) {
          this.actionLocked = true;
          try {
            const response = await action();
            const nextMessage = response.result?.message || response.message || fallbackMessage;
            this.interactText.setText(nextMessage);
            setMessage(nextMessage);
          } catch (error) {
            const nextMessage = error instanceof Error ? error.message : fallbackMessage;
            this.interactText.setText(nextMessage);
            setMessage(nextMessage);
          } finally {
            this.time.delayedCall(950, () => {
              this.actionLocked = false;
            });
          }
        }
      }

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        parent: mountRef.current,
        width: 800,
        height: 480,
        backgroundColor: "#07140d",
        scene: GrowersGroveScene,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH
        }
      });
    }

    boot().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Failed to boot Grower’s Grove.");
    });

    return () => {
      destroyed = true;
      const maybeGame = gameRef.current as { destroy?: (removeCanvas?: boolean) => void } | null;
      maybeGame?.destroy?.(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <section className="grove-shell">
      <div className="grove-status">
        <strong>Seed Man:</strong> {playerHandle || "loading"} · {message}
      </div>
      <div className="grove-canvas" ref={mountRef} />
    </section>
  );
}

async function talkToGardenKeeper(playerId: string): Promise<QuestResponse> {
  await api("/dialogue/garden-keeper-intro");
  await api<QuestResponse>("/quests/start", {
    method: "POST",
    body: JSON.stringify({ playerId, questSlug: "clear-resin-wall" })
  });

  const talkResult = await api<QuestResponse>("/quests/advance", {
    method: "POST",
    body: JSON.stringify({ playerId, questSlug: "clear-resin-wall", actionType: "TALK", targetSlug: "garden-keeper-intro" })
  });

  const returnResult = await api<QuestResponse>("/quests/advance", {
    method: "POST",
    body: JSON.stringify({ playerId, questSlug: "clear-resin-wall", actionType: "RETURN", targetSlug: "garden-keeper-intro" })
  });

  if (returnResult.message.includes("completed")) {
    const claim = await api<QuestResponse>("/quests/claim", {
      method: "POST",
      body: JSON.stringify({ playerId, questSlug: "clear-resin-wall" })
    });

    try {
      const recruit = await api<RecruitmentResponse>("/recruitment/recruit", {
        method: "POST",
        body: JSON.stringify({ playerId, recruitSlug: "recruit-skunk-scout" })
      });
      return { message: `${claim.message} ${recruit.message}` };
    } catch {
      return claim;
    }
  }

  return returnResult.message.startsWith("Current quest step") ? returnResult : talkResult;
}

async function pickup(playerId: string, itemSlug: string, quantity: number): Promise<InteractionResponse> {
  return api<InteractionResponse>("/inventory/pickup", {
    method: "POST",
    body: JSON.stringify({ playerId, itemSlug, quantity })
  });
}

async function pickupAndAdvance(playerId: string, itemSlug: string): Promise<QuestResponse> {
  const item = await pickup(playerId, itemSlug, 1);
  const quest = await api<QuestResponse>("/quests/advance", {
    method: "POST",
    body: JSON.stringify({ playerId, questSlug: "clear-resin-wall", actionType: "PICKUP", targetSlug: itemSlug })
  });
  return { message: `${item.result.message} ${quest.message}` };
}

async function useTool(playerId: string, toolSlug: string, obstacleSlug: string): Promise<InteractionResponse> {
  return api<InteractionResponse>("/interactions/use-tool", {
    method: "POST",
    body: JSON.stringify({ playerId, toolSlug, obstacleSlug })
  });
}

async function useToolAndAdvance(playerId: string, toolSlug: string, obstacleSlug: string): Promise<QuestResponse> {
  const action = await useTool(playerId, toolSlug, obstacleSlug);
  const quest = await api<QuestResponse>("/quests/advance", {
    method: "POST",
    body: JSON.stringify({ playerId, questSlug: "clear-resin-wall", actionType: "USE_TOOL", targetSlug: obstacleSlug })
  });
  return { message: `${action.result.message} ${quest.message}` };
}

async function saveAtCureStation(playerId: string): Promise<SavePointResponse> {
  return api<SavePointResponse>("/savepoints/use", {
    method: "POST",
    body: JSON.stringify({ playerId, savePointSlug: "growers-grove-cure-station" })
  });
}

function createGeneratedTextures(scene: Phaser.Scene) {
  const graphics = scene.add.graphics();

  graphics.clear();
  graphics.fillStyle(0x8b5a2b, 1);
  graphics.fillEllipse(16, 20, 26, 32);
  graphics.fillStyle(0x14351d, 1);
  graphics.fillCircle(11, 16, 2);
  graphics.fillCircle(21, 16, 2);
  graphics.fillStyle(0x6fdb5c, 1);
  graphics.fillTriangle(15, 3, 26, 7, 17, 12);
  graphics.generateTexture("seed-man-texture", 32, 40);

  graphics.clear();
  graphics.fillStyle(0x9ef25b, 1);
  graphics.fillCircle(12, 12, 12);
  graphics.generateTexture("pickup-glow", 24, 24);

  graphics.destroy();
}

function createSeedMan(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y).setDepth(10);
  const shadow = scene.add.ellipse(0, 22, 34, 10, 0x000000, 0.22);
  const sprite = scene.add.image(0, 0, "seed-man-texture").setScale(1.35);
  const label = scene.add.text(-36, 34, "Seed Man", { fontSize: "12px", color: "#f4ffe8" });
  container.add([shadow, sprite, label]);
  return container;
}

function drawGroveFloor(scene: Phaser.Scene) {
  for (let x = 70; x <= 730; x += 55) {
    for (let y = 125; y <= 405; y += 55) {
      scene.add.circle(x, y, 3, 0x2e6d36, 0.85);
    }
  }

  scene.add.rectangle(400, 260, 520, 84, 0x234c2d, 0.65).setStrokeStyle(2, 0x9ef25b, 0.25);
  scene.add.text(302, 247, "Grove Trail", { fontSize: "14px", color: "#bad1b1" });
}

function drawActionObject(scene: Phaser.Scene, x: number, y: number, slug: string, label: string, color: number) {
  scene.add.circle(x, y, 21, color, 0.9).setStrokeStyle(3, 0xffffff, 0.35);
  scene.add.image(x, y, "pickup-glow").setAlpha(0.25);
  scene.add.text(x - 48, y + 28, label, { fontSize: "12px", color: "#f4ffe8" });
  scene.add.text(x - 40, y - 42, slug, { fontSize: "9px", color: "#bad1b1" }).setAlpha(0.65);
}

function drawObstacle(scene: Phaser.Scene, x: number, y: number, slug: string, label: string, color: number) {
  scene.add.rectangle(x, y, 92, 38, color, 0.85).setStrokeStyle(3, 0x331b07, 0.8);
  scene.add.text(x - 56, y + 28, label, { fontSize: "12px", color: "#f4ffe8" });
  scene.add.text(x - 50, y - 40, slug, { fontSize: "9px", color: "#bad1b1" }).setAlpha(0.65);
}

function drawSavePoint(scene: Phaser.Scene, x: number, y: number, slug: string, label: string) {
  scene.add.circle(x, y, 28, 0x6fdb5c, 0.18).setStrokeStyle(3, 0x9ef25b, 0.75);
  scene.add.rectangle(x, y, 42, 52, 0x1f5b3a, 0.95).setStrokeStyle(3, 0xf5c84b, 0.85);
  scene.add.circle(x, y - 18, 10, 0x9ef25b, 0.95);
  scene.add.text(x - 40, y + 36, label, { fontSize: "12px", color: "#f4ffe8" });
  scene.add.text(x - 58, y - 52, slug, { fontSize: "9px", color: "#bad1b1" }).setAlpha(0.65);
}

function drawNpc(scene: Phaser.Scene, x: number, y: number, slug: string, label: string, color: number) {
  scene.add.circle(x, y - 8, 18, color, 1).setStrokeStyle(3, 0xf5c84b, 0.9);
  scene.add.rectangle(x, y + 18, 38, 38, 0x3d622f, 1).setStrokeStyle(2, 0xf4ffe8, 0.5);
  scene.add.text(x - 66, y + 48, label, { fontSize: "12px", color: "#f4ffe8" });
  scene.add.text(x - 50, y - 46, slug, { fontSize: "9px", color: "#bad1b1" }).setAlpha(0.65);
}
