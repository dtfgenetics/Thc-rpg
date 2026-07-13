import { WORLD } from '../data/world.js';
import { GameStore } from '../state/gameStore.js';
import { PLAYER_STATES, PlayerStateMachine } from '../state/playerStateMachine.js';
import { computeMovementIntent, nextEnergy } from '../systems/movementSystem.js';
import { findBestInteraction } from '../systems/interactionSystem.js';
import { InputMap } from '../systems/inputMap.js';
import { ReactionAudio } from '../systems/audioSystem.js';
import { PlayerAnimationController } from '../systems/animationController.js';
import { Hud } from '../../ui/hud.js';

const Phaser = window.Phaser;

export class OverworldScene extends Phaser.Scene {
  constructor() {
    super('OverworldScene');
    this.facing = 'down';
    this.currentTarget = null;
    this.currentZone = null;
    this.dialogueIndexes = new Map();
    this.lastHazardAt = new Map();
    this.lastStoreWriteAt = 0;
    this.runtimeEnergy = 100;
    this.muted = false;
  }

  create() {
    this.store = new GameStore();
    this.hud = new Hud();
    this.audio = new ReactionAudio();
    this.inputMap = new InputMap(this);
    this.stateMachine = new PlayerStateMachine();

    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.setBackgroundColor('#173c2b');

    this.createWorldArtwork();
    this.createGeneratedTextures();
    this.createObstacles();
    this.createInteractables();
    this.createHazards();
    this.createPlayer();
    this.createCamera();

    const persisted = this.store.getState();
    this.runtimeEnergy = persisted.player.energy;
    if (persisted.flags.collectedGlowSeed) this.deactivateInteractable('glow-seed');

    this.unsubscribeStore = this.store.subscribe((state) => {
      this.hud.updateGameState(state);
    });
    this.unsubscribeState = this.stateMachine.subscribe(({ current }) => {
      this.hud.setPlayerState(current);
      this.animationController.setState(current);
    });

    this.hud.onPromptClick(() => this.performInteraction(this.time.now));
    this.hud.onSoundToggle(() => this.toggleSound());
    this.hud.setSoundMuted(this.muted);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeStore?.();
      this.unsubscribeState?.();
    });

    this.hud.showToast('Welcome to Seed Valley. Explore, interact, and follow the objective.', 4200);
  }

  update(time, delta) {
    const input = this.inputMap.read();
    if (input.mutePressed) this.toggleSound();

    this.stateMachine.update(time);
    const locked = this.stateMachine.isMovementLocked(time);
    const intent = locked
      ? { moving: false, dashing: false, facing: null, velocity: { x: 0, y: 0 } }
      : computeMovementIntent(input, this.runtimeEnergy);

    if (intent.facing) this.facing = intent.facing;
    this.player.setVelocity(intent.velocity.x, intent.velocity.y);

    const desiredState = intent.dashing
      ? PLAYER_STATES.DASH
      : intent.moving
        ? PLAYER_STATES.WALK
        : PLAYER_STATES.IDLE;
    this.stateMachine.transition(desiredState, { now: time, reason: 'movement-intent' });

    this.runtimeEnergy = nextEnergy(this.runtimeEnergy, intent, Math.min(delta, 100) / 1000);
    if (intent.moving) this.audio.step(time, intent.dashing);

    this.animationController.update(delta, this.player.body.velocity, this.facing);
    this.updateInteractionTarget();
    this.updateCurrentZone();

    if (input.interactPressed) this.performInteraction(time);
    if (time - this.lastStoreWriteAt > 300) {
      this.lastStoreWriteAt = time;
      const state = this.store.getState();
      if (Math.abs(state.player.energy - this.runtimeEnergy) >= 0.6) {
        this.store.dispatch({ type: 'SET_ENERGY', value: this.runtimeEnergy });
      }
    }
  }

  createWorldArtwork() {
    const graphics = this.add.graphics();
    for (const zone of WORLD.zones) {
      graphics.fillStyle(zone.color, 1);
      graphics.fillRect(zone.x, zone.y, zone.width, zone.height);
      graphics.lineStyle(4, 0xe8f3c2, 0.08);
      graphics.strokeRect(zone.x + 2, zone.y + 2, zone.width - 4, zone.height - 4);
      this.add.text(zone.x + 36, zone.y + 36, zone.name, {
        fontFamily: 'system-ui, sans-serif', fontSize: '27px', fontStyle: 'bold', color: '#f3efce',
        stroke: '#102016', strokeThickness: 5
      }).setAlpha(0.78);
    }

    graphics.lineStyle(86, 0xb8a56b, 0.58);
    graphics.beginPath();
    graphics.moveTo(180, 470);
    graphics.lineTo(520, 560);
    graphics.lineTo(940, 560);
    graphics.lineTo(1210, 410);
    graphics.lineTo(1550, 375);
    graphics.lineTo(1750, 690);
    graphics.lineTo(1390, 800);
    graphics.lineTo(1120, 1040);
    graphics.lineTo(520, 1080);
    graphics.strokePath();

    graphics.lineStyle(6, 0xf1e8bd, 0.18);
    graphics.strokePath();

    this.drawRiver(graphics);
    this.drawEnvironmentDetails(graphics);
  }

  drawRiver(graphics) {
    graphics.fillStyle(0x3f93a1, 0.78);
    graphics.fillRoundedRect(1030, 0, 90, 665, 30);
    graphics.lineStyle(4, 0xbcecf1, 0.22);
    for (let y = 35; y < 650; y += 48) graphics.lineBetween(1045, y, 1100, y + 12);
  }

  drawEnvironmentDetails(graphics) {
    const treePositions = [
      [120, 130], [200, 650], [355, 170], [820, 120], [910, 640], [1180, 120],
      [1430, 165], [1740, 170], [1810, 580], [130, 860], [240, 1170], [1040, 1160],
      [1750, 1130], [1250, 930]
    ];
    for (const [x, y] of treePositions) {
      graphics.fillStyle(0x1c4c31, 0.95);
      graphics.fillCircle(x, y, 42);
      graphics.fillStyle(0x2e7c48, 0.94);
      graphics.fillCircle(x - 18, y - 18, 28);
      graphics.fillCircle(x + 20, y - 15, 30);
      graphics.fillStyle(0x6d4f2f, 1);
      graphics.fillRect(x - 7, y + 25, 14, 30);
    }

    for (let index = 0; index < 90; index += 1) {
      const x = 40 + ((index * 173) % (WORLD.width - 80));
      const y = 60 + ((index * 97) % (WORLD.height - 120));
      graphics.fillStyle(index % 3 === 0 ? 0xd9ff79 : 0xa5cf83, 0.25);
      graphics.fillCircle(x, y, 2 + (index % 3));
    }
  }

  createGeneratedTextures() {
    const player = this.make.graphics({ x: 0, y: 0, add: false });
    player.fillStyle(0xf3c85b, 1);
    player.fillEllipse(32, 34, 42, 52);
    player.fillStyle(0x7c4c2e, 1);
    player.fillTriangle(25, 9, 39, 9, 32, 0);
    player.fillStyle(0x1d2e1c, 1);
    player.fillCircle(25, 30, 3);
    player.fillCircle(39, 30, 3);
    player.lineStyle(3, 0x7c4c2e, 1);
    player.beginPath();
    player.arc(32, 37, 8, 0.2, Math.PI - 0.2);
    player.strokePath();
    player.fillStyle(0x4fa95c, 1);
    player.fillRoundedRect(17, 50, 30, 11, 5);
    player.generateTexture('player-seed', 64, 68);
    player.destroy();

    const npc = this.make.graphics({ x: 0, y: 0, add: false });
    npc.fillStyle(0xd39a4f, 1);
    npc.fillEllipse(32, 34, 44, 54);
    npc.fillStyle(0x2b6d3c, 1);
    npc.fillTriangle(21, 10, 44, 10, 32, 0);
    npc.fillStyle(0x142419, 1);
    npc.fillCircle(25, 30, 3);
    npc.fillCircle(39, 30, 3);
    npc.lineStyle(3, 0x6f3a20, 1);
    npc.beginPath();
    npc.arc(32, 37, 8, 0.2, Math.PI - 0.2);
    npc.strokePath();
    npc.generateTexture('seed-man', 64, 68);
    npc.destroy();

    const seed = this.make.graphics({ x: 0, y: 0, add: false });
    seed.fillStyle(0xeaff86, 1);
    seed.fillEllipse(24, 26, 26, 34);
    seed.lineStyle(3, 0xffffff, 0.85);
    seed.strokeEllipse(24, 26, 28, 36);
    seed.generateTexture('glow-seed', 48, 52);
    seed.destroy();
  }

  createObstacles() {
    this.obstacles = this.physics.add.staticGroup();
    for (const obstacle of WORLD.obstacles) {
      const color = obstacle.label === 'Riverbank' ? 0x2f7183 : obstacle.label === 'Greenhouse' ? 0x7ebf85 : 0x4b4a3c;
      const rectangle = this.add.rectangle(obstacle.x, obstacle.y, obstacle.width, obstacle.height, color, 0.83)
        .setStrokeStyle(4, 0xe4e5b8, 0.25);
      this.physics.add.existing(rectangle, true);
      this.obstacles.add(rectangle);
      this.add.text(obstacle.x, obstacle.y, obstacle.label, {
        fontFamily: 'system-ui, sans-serif', fontSize: '17px', color: '#f7f3dd', backgroundColor: '#13271fbb', padding: { x: 7, y: 4 }
      }).setOrigin(0.5);
    }
  }

  createInteractables() {
    this.interactables = WORLD.interactables.map((definition) => {
      let sprite;
      if (definition.id === 'seed-man') {
        sprite = this.physics.add.sprite(definition.x, definition.y, 'seed-man').setDepth(5);
      } else if (definition.id === 'glow-seed') {
        sprite = this.physics.add.sprite(definition.x, definition.y, 'glow-seed').setDepth(4);
        this.tweens.add({ targets: sprite, y: definition.y - 9, alpha: 0.72, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      } else {
        const color = definition.type === 'shrine' ? 0xb595f3 : 0xe4d39c;
        sprite = this.add.star(definition.x, definition.y, definition.type === 'shrine' ? 6 : 4, 14, 28, color, 0.92)
          .setStrokeStyle(3, 0xffffff, 0.4)
          .setDepth(4);
        this.physics.add.existing(sprite, true);
      }
      if (sprite.body && !sprite.body.immovable) sprite.body.setImmovable(true);
      return { ...definition, active: true, sprite, x: definition.x, y: definition.y };
    });
  }

  createHazards() {
    this.hazards = this.physics.add.staticGroup();
    for (const hazard of WORLD.hazards) {
      const zone = this.add.rectangle(hazard.x, hazard.y, hazard.width, hazard.height, 0xff6f73, 0.16)
        .setStrokeStyle(2, 0xffb0a3, 0.35);
      zone.hazardData = hazard;
      this.physics.add.existing(zone, true);
      this.hazards.add(zone);
    }
  }

  createPlayer() {
    const state = this.store.getState();
    const spawn = state.player.position ?? WORLD.spawn;
    this.shadow = this.add.ellipse(spawn.x, spawn.y + 21, 42, 14, 0x000000, 0.28).setDepth(9);
    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'player-seed').setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(34, 35).setOffset(15, 29);
    this.physics.add.collider(this.player, this.obstacles, () => this.onBump());
    this.physics.add.overlap(this.player, this.hazards, (_player, zone) => this.onHazard(zone.hazardData));
    this.animationController = new PlayerAnimationController(this, this.player, this.shadow);
  }

  createCamera() {
    this.cameras.main.startFollow(this.player, true, 0.11, 0.11);
    this.cameras.main.setDeadzone(Math.min(180, this.scale.width * 0.22), Math.min(120, this.scale.height * 0.2));
    this.cameras.main.setZoom(this.scale.width < 700 ? 0.9 : 1);
    this.scale.on('resize', (gameSize) => {
      this.cameras.main.setDeadzone(Math.min(180, gameSize.width * 0.22), Math.min(120, gameSize.height * 0.2));
      this.cameras.main.setZoom(gameSize.width < 700 ? 0.9 : 1);
    });
  }

  updateInteractionTarget() {
    this.currentTarget = findBestInteraction({ x: this.player.x, y: this.player.y, facing: this.facing }, this.interactables);
    this.hud.setPrompt(this.currentTarget?.label, Boolean(this.currentTarget));
  }

  updateCurrentZone() {
    const zone = WORLD.zones.find((candidate) => (
      this.player.x >= candidate.x && this.player.x <= candidate.x + candidate.width
      && this.player.y >= candidate.y && this.player.y <= candidate.y + candidate.height
    ));
    if (!zone || zone.name === this.currentZone) return;
    this.currentZone = zone.name;
    this.hud.showToast(zone.name, 1500);
  }

  performInteraction(now) {
    if (!this.currentTarget || this.stateMachine.isMovementLocked(now)) return;
    this.audio.unlock();
    this.player.setVelocity(0, 0);
    this.stateMachine.transition(PLAYER_STATES.INTERACT, { now, lockMs: 420, reason: this.currentTarget.id });
    this.audio.interact();

    switch (this.currentTarget.id) {
      case 'seed-man':
        this.interactWithSeedMan();
        break;
      case 'glow-seed':
        this.collectGlowSeed(now);
        break;
      case 'research-shrine':
        this.studyShrine(now);
        break;
      default:
        this.hud.showToast(this.currentTarget.text ?? 'You inspect the area.');
        this.reactionBurst(this.currentTarget.x, this.currentTarget.y, 0xf5e7a1, 7);
    }
  }

  interactWithSeedMan() {
    const target = this.currentTarget;
    const index = this.dialogueIndexes.get(target.id) ?? 0;
    this.hud.showToast(target.dialogue[index], 4200);
    this.dialogueIndexes.set(target.id, (index + 1) % target.dialogue.length);
    if (!this.store.getState().flags.metSeedMan) {
      this.store.dispatch({ type: 'MET_SEED_MAN' });
      this.showEmote(target.sprite, '!');
      this.reactionBurst(target.x, target.y - 30, 0xd9ff79, 10);
    } else {
      this.showEmote(target.sprite, '…');
    }
  }

  collectGlowSeed(now) {
    const state = this.store.getState();
    if (!state.flags.metSeedMan) {
      this.audio.denied();
      this.hud.showToast('The seed resists your touch. Seed Man may know how to approach it.');
      this.showEmote(this.currentTarget.sprite, '?');
      return;
    }
    if (state.flags.collectedGlowSeed) return;

    const target = this.currentTarget;
    this.store.dispatch({ type: 'COLLECT_GLOW_SEED' });
    this.audio.pickup();
    this.stateMachine.transition(PLAYER_STATES.CELEBRATE, { now, lockMs: 700, reason: 'glow-seed-collected' });
    this.hud.showToast(target.text, 4200);
    this.reactionBurst(target.x, target.y, 0xeaff86, 22);
    this.cameras.main.shake(180, 0.003);
    this.deactivateInteractable(target.id);
  }

  studyShrine(now) {
    const state = this.store.getState();
    if (!state.flags.collectedGlowSeed) {
      this.audio.denied();
      this.hud.showToast('The shrine is dormant. Its central recess is shaped like a seed.');
      this.showEmote(this.currentTarget.sprite, '◇');
      return;
    }
    if (state.flags.visitedResearchShrine) {
      this.hud.showToast(this.currentTarget.text);
      return;
    }

    this.store.dispatch({ type: 'VISIT_RESEARCH_SHRINE' });
    this.audio.celebrate();
    this.stateMachine.transition(PLAYER_STATES.CELEBRATE, { now, lockMs: 1000, reason: 'quest-complete' });
    this.hud.showToast('The Glow Seed activates the lineage map. New regions and Pheno research can now be connected here.', 5000);
    this.reactionBurst(this.currentTarget.x, this.currentTarget.y, 0xc7a6ff, 30);
    this.cameras.main.flash(250, 219, 255, 121, false);
  }

  deactivateInteractable(id) {
    const target = this.interactables.find((candidate) => candidate.id === id);
    if (!target) return;
    target.active = false;
    target.sprite.disableBody?.(true, true);
    target.sprite.setVisible?.(false);
    this.currentTarget = null;
    this.hud.setPrompt('', false);
  }

  onBump() {
    if (this.time.now - (this.lastBumpAt ?? 0) < 280) return;
    this.lastBumpAt = this.time.now;
    this.audio.tone({ frequency: 105, duration: 0.05, type: 'triangle', gain: 0.08, slideTo: 75 });
  }

  onHazard(hazard) {
    const now = this.time.now;
    const last = this.lastHazardAt.get(hazard.id) ?? -Infinity;
    if (now - last < hazard.cooldownMs) return;
    this.lastHazardAt.set(hazard.id, now);
    this.stateMachine.transition(PLAYER_STATES.HURT, { now, lockMs: 520, reason: hazard.id });
    this.player.setVelocity(0, 0);
    this.audio.hurt();
    this.hud.showToast(hazard.message, 3400);
    this.cameras.main.shake(180, 0.007);
    this.reactionBurst(this.player.x, this.player.y, 0xff8b72, 12);
  }

  reactionBurst(x, y, color, count) {
    for (let index = 0; index < count; index += 1) {
      const dot = this.add.circle(x, y, Phaser.Math.Between(2, 5), color, 0.9).setDepth(20);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(22, 78);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(350, 720),
        ease: 'Cubic.Out',
        onComplete: () => dot.destroy()
      });
    }
  }

  showEmote(sprite, text) {
    const emote = this.add.text(sprite.x, sprite.y - 58, text, {
      fontFamily: 'system-ui, sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#172019',
      backgroundColor: '#f7f2d6', padding: { x: 9, y: 5 }
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: emote, y: emote.y - 18, alpha: 0, delay: 650, duration: 420, onComplete: () => emote.destroy() });
  }

  toggleSound() {
    this.muted = !this.muted;
    this.audio.setMuted(this.muted);
    this.hud.setSoundMuted(this.muted);
    if (!this.muted) this.audio.interact();
  }
}
