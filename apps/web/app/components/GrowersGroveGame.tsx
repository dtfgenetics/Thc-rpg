"use client";

import type { RegionMapStateView } from "@thc/rpg-kernel";
import { useEffect, useRef, useState } from "react";
import {
  getGrowersGroveAction,
  type GroveEntityAction
} from "../games/pheno-quest/grove/growersGroveActions";
import {
  GROWERS_GROVE_REGION_SLUG,
  growersGroveEntities,
  type GroveEntityDefinition
} from "../games/pheno-quest/grove/growersGroveManifest";
import { GameTouchControls, type MobileDirection, type MobileInputState } from "./GameTouchControls";
import { gameApi } from "./gameApi";
import { createEmptyMobileInputState, getMovementVector } from "./gameInput";

type PlayerSummary = {
  id: string;
  handle: string;
};

type PhaserSceneLike = any;
type RegisteredGameObject = { destroy?: () => void };

type ProximityTarget = GroveEntityDefinition & {
  action: GroveEntityAction;
};

export default function GrowersGroveGame() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<{ destroy: (removeCanvas: boolean, noReturn?: boolean) => void } | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const mapStateRef = useRef<RegionMapStateView | null>(null);
  const mobileInputRef = useRef<MobileInputState>(createEmptyMobileInputState());
  const mobileInteractRef = useRef(false);
  const [message, setMessage] = useState("Loading Seed Man into Grower’s Grove...");
  const [playerHandle, setPlayerHandle] = useState<string>("");

  function setMobileDirection(direction: MobileDirection, pressed: boolean) {
    mobileInputRef.current = { ...mobileInputRef.current, [direction]: pressed };
  }

  function stopAllMobileMovement() {
    mobileInputRef.current = createEmptyMobileInputState();
  }

  function queueMobileInteract() {
    mobileInteractRef.current = true;
  }

  async function refreshRegionMapState(playerId: string) {
    const state = await gameApi<RegionMapStateView>(`/regions/${GROWERS_GROVE_REGION_SLUG}/state/${playerId}`);
    mapStateRef.current = state;
    return state;
  }

  function isRegionItemVisible(slug: string) {
    return mapStateRef.current?.items.find((item) => item.slug === slug)?.visible ?? true;
  }

  function isRegionObstacleVisible(slug: string) {
    return mapStateRef.current?.obstacles.find((obstacle) => obstacle.slug === slug)?.visible ?? true;
  }

  function isEntityVisible(entity: GroveEntityDefinition) {
    if (entity.kind === "ITEM") return isRegionItemVisible(entity.slug);
    if (entity.kind === "OBSTACLE") return isRegionObstacleVisible(entity.slug);
    return true;
  }

  function isTargetAvailable(slug: string) {
    const entity = growersGroveEntities.find((candidate) => candidate.slug === slug);
    return entity ? isEntityVisible(entity) : true;
  }

  async function requestFullscreen() {
    const target = mountRef.current;
    if (!target?.requestFullscreen) {
      setMessage("Fullscreen is not available in this browser.");
      return;
    }

    try {
      await target.requestFullscreen();
      setMessage("Grower’s Grove fullscreen enabled.");
    } catch {
      setMessage("Fullscreen request was blocked by the browser.");
    }
  }

  useEffect(() => {
    let destroyed = false;

    async function boot() {
      const Phaser = await import("phaser");
      if (destroyed || !mountRef.current || gameRef.current) return;

      const devPlayer = await gameApi<PlayerSummary>("/dev/player", {
        method: "POST",
        body: JSON.stringify({ handle: "DTF Demo Grower" })
      });

      await refreshRegionMapState(devPlayer.id);

      playerIdRef.current = devPlayer.id;
      setPlayerHandle(devPlayer.handle);
      setMessage("Move Seed Man with arrows/WASD or touch controls. Press E, Space, or Interact near objects.");

      class GrowersGroveScene extends Phaser.Scene {
        private seedMan!: any;
        private cursors!: any;
        private wasd!: Record<string, any>;
        private interactKey!: any;
        private interactText!: any;
        private actionLocked = false;
        private speed = 170;
        private lastHint = "Seed Man is ready. Start with Garden Keeper Nugsworth, then use the Cure Station before battling.";
        private objectRegistry = new Map<string, RegisteredGameObject[]>();

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
          for (const entity of growersGroveEntities) {
            if (!isEntityVisible(entity)) continue;
            const objects = drawEntity(this, entity);
            if (entity.kind === "ITEM" || entity.kind === "OBSTACLE") {
              this.registerObjects(entity.slug, objects);
            }
          }

          this.seedMan = createSeedMan(this, 90, 260);
          this.cursors = this.input.keyboard!.createCursorKeys();
          this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, any>;
          this.interactKey = this.input.keyboard!.addKey("E");

          this.interactText = this.add
            .text(24, 450, this.lastHint, {
              fontSize: "15px",
              color: "#f4ffe8",
              backgroundColor: "#102016",
              padding: { x: 10, y: 8 }
            })
            .setDepth(20);
        }

        update(_time: number, delta: number) {
          const dt = delta / 1000;
          const movement = getMovementVector({
            keyboard: {
              left: Boolean(this.cursors.left?.isDown || this.wasd.A.isDown),
              right: Boolean(this.cursors.right?.isDown || this.wasd.D.isDown),
              up: Boolean(this.cursors.up?.isDown || this.wasd.W.isDown),
              down: Boolean(this.cursors.down?.isDown || this.wasd.S.isDown)
            },
            mobile: mobileInputRef.current
          });

          if (movement.x !== 0 || movement.y !== 0) {
            this.seedMan.x = Phaser.Math.Clamp(this.seedMan.x + movement.x * this.speed * dt, 58, 742);
            this.seedMan.y = Phaser.Math.Clamp(this.seedMan.y + movement.y * this.speed * dt, 110, 410);
          }

          void this.checkInteractions(Phaser);
        }

        private registerObjects(slug: string, objects: RegisteredGameObject[]) {
          this.objectRegistry.set(slug, objects);
        }

        private syncObjectVisibility() {
          for (const [slug, objects] of this.objectRegistry.entries()) {
            if (!isTargetAvailable(slug)) {
              for (const object of objects) {
                object.destroy?.();
              }
              this.objectRegistry.delete(slug);
            }
          }
        }

        private getTargets(): ProximityTarget[] {
          return growersGroveEntities
            .filter((entity) => isTargetAvailable(entity.slug))
            .map((entity) => ({ ...entity, action: getGrowersGroveAction(entity.slug) }));
        }

        private async checkInteractions(phaser: typeof Phaser) {
          if (this.actionLocked) return;

          const playerId = playerIdRef.current;
          if (!playerId) return;

          const nearby = this.getTargets().find(
            (target) => phaser.Math.Distance.Between(this.seedMan.x, this.seedMan.y, target.x, target.y) < target.radius
          );

          if (!nearby) {
            if (this.lastHint !== "Move near an object and press E, Space, or Interact.") {
              this.lastHint = "Move near an object and press E, Space, or Interact.";
              this.interactText.setText(this.lastHint);
            }
            mobileInteractRef.current = false;
            return;
          }

          if (this.lastHint !== nearby.hint) {
            this.lastHint = nearby.hint;
            this.interactText.setText(nearby.hint);
          }

          const pressedMobileInteract = mobileInteractRef.current;
          const pressedKeyboardInteract =
            phaser.Input.Keyboard.JustDown(this.interactKey) ||
            Boolean(this.cursors.space && phaser.Input.Keyboard.JustDown(this.cursors.space));

          if (!pressedMobileInteract && !pressedKeyboardInteract) return;

          mobileInteractRef.current = false;
          await this.runAction(() => nearby.action(playerId), nearby.hint, playerId);
        }

        private async runAction(action: () => ReturnType<GroveEntityAction>, fallbackMessage: string, playerId: string) {
          this.actionLocked = true;
          try {
            const response = await action();
            await refreshRegionMapState(playerId);
            this.syncObjectVisibility();
            const nextMessage = response.result?.message || response.message || fallbackMessage;
            this.lastHint = nextMessage;
            this.interactText.setText(nextMessage);
            setMessage(nextMessage);
            if (response.navigateTo) {
              window.location.assign(response.navigateTo);
              return;
            }
          } catch (error) {
            const nextMessage = error instanceof Error ? error.message : fallbackMessage;
            this.lastHint = nextMessage;
            this.interactText.setText(nextMessage);
            setMessage(nextMessage);
          } finally {
            this.time.delayedCall(650, () => {
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
      stopAllMobileMovement();
      gameRef.current?.destroy?.(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <section className="grove-shell">
      <div className="grove-status">
        <strong>Seed Man:</strong> {playerHandle || "loading"} · {message}
      </div>
      <div className="grove-canvas" ref={mountRef} />
      <GameTouchControls
        onDirectionChange={setMobileDirection}
        onStopMovement={stopAllMobileMovement}
        onInteract={queueMobileInteract}
        onFullscreen={() => void requestFullscreen()}
      />
    </section>
  );
}

function drawEntity(scene: PhaserSceneLike, entity: GroveEntityDefinition): RegisteredGameObject[] {
  if (entity.kind === "ITEM") {
    return drawActionObject(scene, entity.x, entity.y, entity.slug, entity.label, entity.color ?? 0xf5c84b);
  }

  if (entity.kind === "OBSTACLE") {
    return drawObstacle(scene, entity.x, entity.y, entity.slug, entity.label, entity.color ?? 0xcc8a31);
  }

  if (entity.kind === "SAVE_POINT") {
    drawSavePoint(scene, entity.x, entity.y, entity.slug, entity.label);
    return [];
  }

  drawNpc(scene, entity.x, entity.y, entity.slug, entity.label, entity.color ?? 0x6da94d);
  return [];
}

function createGeneratedTextures(scene: PhaserSceneLike) {
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

function createSeedMan(scene: PhaserSceneLike, x: number, y: number) {
  const container = scene.add.container(x, y).setDepth(10);
  const shadow = scene.add.ellipse(0, 22, 34, 10, 0x000000, 0.22);
  const sprite = scene.add.image(0, 0, "seed-man-texture").setScale(1.35);
  const label = scene.add.text(-36, 34, "Seed Man", { fontSize: "12px", color: "#f4ffe8" });
  container.add([shadow, sprite, label]);
  return container;
}

function drawGroveFloor(scene: PhaserSceneLike) {
  for (let x = 70; x <= 730; x += 55) {
    for (let y = 125; y <= 405; y += 55) {
      scene.add.circle(x, y, 3, 0x2e6d36, 0.85);
    }
  }

  scene.add.rectangle(400, 260, 520, 84, 0x234c2d, 0.65).setStrokeStyle(2, 0x9ef25b, 0.25);
  scene.add.text(302, 247, "Grove Trail", { fontSize: "14px", color: "#bad1b1" });
}

function drawActionObject(scene: PhaserSceneLike, x: number, y: number, slug: string, label: string, color: number): RegisteredGameObject[] {
  const body = scene.add.circle(x, y, 21, color, 0.9).setStrokeStyle(3, 0xffffff, 0.35);
  const glow = scene.add.image(x, y, "pickup-glow").setAlpha(0.25);
  const labelText = scene.add.text(x - 48, y + 28, label, { fontSize: "12px", color: "#f4ffe8" });
  const slugText = scene.add.text(x - 40, y - 42, slug, { fontSize: "9px", color: "#bad1b1" }).setAlpha(0.65);
  return [body, glow, labelText, slugText];
}

function drawObstacle(scene: PhaserSceneLike, x: number, y: number, slug: string, label: string, color: number): RegisteredGameObject[] {
  const body = scene.add.rectangle(x, y, 92, 38, color, 0.85).setStrokeStyle(3, 0x331b07, 0.8);
  const labelText = scene.add.text(x - 56, y + 28, label, { fontSize: "12px", color: "#f4ffe8" });
  const slugText = scene.add.text(x - 50, y - 40, slug, { fontSize: "9px", color: "#bad1b1" }).setAlpha(0.65);
  return [body, labelText, slugText];
}

function drawSavePoint(scene: PhaserSceneLike, x: number, y: number, slug: string, label: string) {
  scene.add.circle(x, y, 28, 0x6fdb5c, 0.18).setStrokeStyle(3, 0x9ef25b, 0.75);
  scene.add.rectangle(x, y, 42, 52, 0x1f5b3a, 0.95).setStrokeStyle(3, 0xf5c84b, 0.85);
  scene.add.circle(x, y - 18, 10, 0x9ef25b, 0.95);
  scene.add.text(x - 40, y + 36, label, { fontSize: "12px", color: "#f4ffe8" });
  scene.add.text(x - 58, y - 52, slug, { fontSize: "9px", color: "#bad1b1" }).setAlpha(0.65);
}

function drawNpc(scene: PhaserSceneLike, x: number, y: number, slug: string, label: string, color: number) {
  scene.add.circle(x, y - 8, 18, color, 1).setStrokeStyle(3, 0xf5c84b, 0.9);
  scene.add.rectangle(x, y + 18, 38, 38, 0x3d622f, 1).setStrokeStyle(2, 0xf4ffe8, 0.5);
  scene.add.text(x - 66, y + 48, label, { fontSize: "12px", color: "#f4ffe8" });
  scene.add.text(x - 50, y - 46, slug, { fontSize: "9px", color: "#bad1b1" }).setAlpha(0.65);
}
