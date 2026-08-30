import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../src/game/Game.js';
import { Plant } from '../src/game/Plant.js';
import { Inventory } from '../src/game/Inventory.js';

const gameData = JSON.parse(await readFile(new URL('../src/data/game-data.json', import.meta.url), 'utf8'));

describe('Inventory', () => {
    it('adds and removes valid item counts', () => {
        const inv = new Inventory();
        assert.equal(inv.add('seed', 'blue_mango', 2), true);
        assert.equal(inv.get('seed', 'blue_mango'), 2);
        assert.equal(inv.remove('seed', 'blue_mango'), true);
        assert.equal(inv.get('seed', 'blue_mango'), 1);
    });

    it('rejects invalid categories and non-positive counts', () => {
        const inv = new Inventory();
        assert.equal(inv.add('money', 'cash', 1), false);
        assert.equal(inv.add('seed', 'blue_mango', 0), false);
        assert.equal(inv.add('seed', 'blue_mango', -1), false);
        assert.equal(inv.has('seed', 'blue_mango', 0), false);
    });

    it('returns copies rather than live category objects', () => {
        const inv = new Inventory();
        inv.add('seed', 'blue_mango', 1);
        const snapshot = inv.getAll('seed');
        snapshot.blue_mango = 999;
        assert.equal(inv.get('seed', 'blue_mango'), 1);
    });
});

describe('Plant', () => {
    it('creates and progresses through stages', () => {
        const p = new Plant(gameData.genetics.blue_mango, 0);
        assert.equal(p.stage, 'seed');
        p.development = 25;
        p.updateStage();
        assert.equal(p.stage, 'vegetative');
    });

    it('loses hydration over elapsed time', () => {
        const p = new Plant(gameData.genetics.blue_mango, 0);
        p.update(10_000);
        assert.ok(p.hydration < 80);
    });

    it('builds stress and loses health when severely dry', () => {
        const p = new Plant(gameData.genetics.blue_mango, 0);
        p.hydration = 10;
        p.update(30_000);
        assert.ok(p.stress > 0);
        assert.ok(p.health < 100);
    });

    it('calculates quality on a 1-100 scale', () => {
        const p = new Plant(gameData.genetics.blue_mango, 0);
        const quality = p.calculateQuality();
        assert.ok(quality >= 80 && quality <= 100);
    });

    it('preserves zero values through save/load', () => {
        const p = new Plant(gameData.genetics.blue_mango, 0);
        p.health = 0;
        p.vigor = 0;
        p.hydration = 0;
        p.development = 0;
        const loaded = Plant.load(p.save(), gameData.genetics.blue_mango);
        assert.equal(loaded.health, 0);
        assert.equal(loaded.vigor, 0);
        assert.equal(loaded.hydration, 0);
        assert.equal(loaded.development, 0);
    });

    it('caps a single simulation tick to limit clock-jump exploits', () => {
        const p = new Plant(gameData.genetics.blue_mango, 0);
        p.update(3_600_000);
        assert.ok(p.development < 10);
        assert.ok(p.hydration > 70);
    });
});

describe('Game', () => {
    it('creates a game and plants a valid seed', () => {
        const game = new Game('Test', gameData);
        game.inventory.add('seed', 'blue_mango', 1);
        assert.equal(game.plantSeed('blue_mango'), true);
        assert.ok(game.plant);
        assert.equal(game.inventory.get('seed', 'blue_mango'), 0);
    });

    it('does not consume a seed if genetics are invalid', () => {
        const game = new Game('Test', gameData);
        game.inventory.add('seed', 'missing_genetics', 1);
        assert.equal(game.plantSeed('missing_genetics'), false);
        assert.equal(game.inventory.get('seed', 'missing_genetics'), 1);
    });

    it('enforces location exits', () => {
        const game = new Game('Test', gameData);
        assert.equal(game.moveTo('mentor_shop'), false);
        assert.equal(game.moveTo('main_street'), true);
        assert.equal(game.moveTo('mentor_shop'), true);
    });

    it('uses player.money as the only currency source', () => {
        const game = new Game('Test', gameData);
        assert.equal(game.player.money, 100);
        assert.equal('money' in game.inventory, false);
    });

    it('tracks first-seed objectives and awards quest rewards exactly once', () => {
        const game = new Game('Test', gameData);
        assert.equal(game.startQuest('first_seed'), true);
        game.inventory.add('seed', 'blue_mango', 1);
        assert.equal(game.plantSeed('blue_mango'), true);
        game.plant.development = 100;
        game.plant.updateStage();
        const beforeMoney = game.player.money;
        const beforeBubblegum = game.inventory.get('seed', 'blue_bubblegum');
        const harvest = game.harvest();
        assert.ok(harvest);
        assert.equal(game.isQuestReady('first_seed'), true);
        assert.equal(game.completeQuest('first_seed'), true);
        assert.equal(game.completeQuest('first_seed'), false);
        assert.equal(game.inventory.get('seed', 'blue_bubblegum'), beforeBubblegum + 2);
        assert.equal(game.player.money, beforeMoney + harvest.money + 50);
        assert.deepEqual(game.quests.completed, ['first_seed']);
    });

    it('round-trips version 2 saves without duplicating genetics data', () => {
        const game = new Game('Test', gameData);
        game.inventory.add('seed', 'blue_mango', 1);
        game.plantSeed('blue_mango');
        game.plant.hydration = 0;
        const saved = game.save();
        assert.equal(saved.version, 2);
        assert.equal(saved.plant.geneticsId, 'blue_mango');
        assert.equal('genetics' in saved.plant, false);
        const loaded = new Game('Other', gameData);
        loaded.load(saved);
        assert.equal(loaded.player.name, 'Test');
        assert.equal(loaded.plant.geneticsId, 'blue_mango');
        assert.equal(loaded.plant.hydration, 0);
    });

    it('migrates version 1 money and embedded plant genetics', () => {
        const legacy = {
            version: 1,
            player: { name: 'Legacy', level: 1, xp: 0, xpToNext: 100, money: 50, reputation: 0 },
            inventory: { seed: {}, item: {}, harvest: {}, money: 175 },
            plant: { genetics: gameData.genetics.blue_mango, stage: 'seedling', age: 1, health: 0, vigor: 85, stress: 10, hydration: 0, development: 10, startTime: 0 },
            quests: { active: [], completed: [] },
            location: 'grow_room',
            time: 0
        };
        const game = new Game('Test', gameData);
        game.load(legacy);
        assert.equal(game.player.money, 175);
        assert.equal(game.plant.geneticsId, 'blue_mango');
        assert.equal(game.plant.health, 0);
        assert.equal(game.plant.hydration, 0);
    });

    it('rejects unsupported save versions', () => {
        const game = new Game('Test', gameData);
        assert.throws(() => game.load({ version: 999 }), /Unsupported save version/);
    });
});
