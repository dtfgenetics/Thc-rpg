import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../src/game/Game.js';
import { Plant } from '../src/game/Plant.js';
import { Inventory } from '../src/game/Inventory.js';
import { Environment } from '../src/game/Environment.js';
import { generatePhenotype } from '../src/game/Phenotype.js';

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

describe('Phenotype', () => {
    it('is deterministic for the same genetics and seed', () => {
        const genetics = gameData.genetics.blue_mango;
        assert.deepEqual(generatePhenotype(genetics, 123456), generatePhenotype(genetics, 123456));
    });

    it('produces different expression from different seeds', () => {
        const genetics = gameData.genetics.blue_mango;
        assert.notDeepEqual(generatePhenotype(genetics, 1), generatePhenotype(genetics, 2));
    });

    it('keeps phenotype stats inside configured genetic bounds', () => {
        const genetics = gameData.genetics.blue_mango;
        const variation = genetics.phenotypeVariation;
        for (let seed = 1; seed <= 100; seed += 1) {
            const phenotype = generatePhenotype(genetics, seed);
            assert.ok(phenotype.vigor >= genetics.vigor - variation.vigor && phenotype.vigor <= genetics.vigor + variation.vigor);
            assert.ok(phenotype.yieldPotential >= genetics.yieldPotential - variation.yieldPotential && phenotype.yieldPotential <= genetics.yieldPotential + variation.yieldPotential);
            assert.ok(phenotype.qualityPotential >= genetics.qualityPotential - variation.qualityPotential && phenotype.qualityPotential <= genetics.qualityPotential + variation.qualityPotential);
            assert.ok(phenotype.resilience >= genetics.resilience - variation.resilience && phenotype.resilience <= genetics.resilience + variation.resilience);
            assert.ok(phenotype.floweringDays >= genetics.floweringDays.min && phenotype.floweringDays <= genetics.floweringDays.max);
            assert.ok(phenotype.dominantTraits.length <= variation.traitCount);
            assert.ok(phenotype.dominantTraits.every(trait => genetics.traits.includes(trait)));
        }
    });
});

describe('Environment', () => {
    it('calculates lower VPD when humidity rises at the same temperature', () => {
        const dry = new Environment({ temperature: 75, humidity: 40 });
        const humid = new Environment({ temperature: 75, humidity: 80 });
        assert.ok(dry.getVpd() > humid.getVpd());
    });

    it('scores a balanced room better than an extreme room', () => {
        const balanced = new Environment({ temperature: 76, humidity: 60, light: 70, ph: 6.2, ec: 1.1 });
        const extreme = new Environment({ temperature: 105, humidity: 95, light: 5, ph: 8.5, ec: 3.8 });
        assert.ok(balanced.evaluate('vegetative').score > extreme.evaluate('vegetative').score);
        assert.equal(extreme.evaluate('vegetative').status, 'danger');
    });

    it('clamps environment controls to safe game bounds', () => {
        const environment = new Environment();
        environment.set('temperature', 999);
        environment.set('humidity', -20);
        environment.set('light', 200);
        environment.set('ph', 99);
        environment.set('ec', -1);
        assert.deepEqual(environment.save(), { temperature: 110, humidity: 10, light: 100, ph: 9, ec: 0 });
        assert.equal(environment.set('missing', 1), false);
    });

    it('round-trips its state', () => {
        const environment = new Environment({ temperature: 81, humidity: 55, light: 72, ph: 6.4, ec: 1.3 });
        assert.deepEqual(new Environment(environment.save()).save(), environment.save());
    });
});

describe('Plant', () => {
    it('creates and progresses through stages', () => {
        const p = new Plant(gameData.genetics.blue_mango, 0, 100);
        assert.equal(p.stage, 'seed');
        p.development = 25;
        p.updateStage();
        assert.equal(p.stage, 'vegetative');
    });

    it('loses hydration over elapsed time', () => {
        const p = new Plant(gameData.genetics.blue_mango, 0, 100);
        p.update(10_000);
        assert.ok(p.hydration < 80);
    });

    it('builds stress and loses health when severely dry', () => {
        const p = new Plant(gameData.genetics.blue_mango, 0, 100);
        p.hydration = 10;
        p.update(30_000);
        assert.ok(p.stress > 0);
        assert.ok(p.health < 100);
    });

    it('uses resilience to reduce stress and health damage', () => {
        const base = {
            id: 'resilience_test',
            name: 'Resilience Test',
            vigor: 80,
            yieldPotential: 70,
            qualityPotential: 80,
            floweringDays: { min: 60, max: 60 },
            traits: ['test'],
            phenotypeVariation: { vigor: 0, yieldPotential: 0, qualityPotential: 0, resilience: 0, traitCount: 1 }
        };
        const high = new Plant({ ...base, resilience: 100 }, 0, 1);
        const low = new Plant({ ...base, resilience: 0 }, 0, 1);
        high.hydration = 10;
        low.hydration = 10;
        high.update(30_000);
        low.update(30_000);
        assert.ok(high.stress < low.stress);
        assert.ok(high.health > low.health);
    });

    it('grows slower and accumulates more stress in a poor environment', () => {
        const goodRoom = new Environment({ temperature: 76, humidity: 60, light: 70, ph: 6.2, ec: 1.1 });
        const badRoom = new Environment({ temperature: 105, humidity: 95, light: 5, ph: 8.5, ec: 3.8 });
        const good = new Plant(gameData.genetics.blue_mango, 0, 500);
        const bad = new Plant(gameData.genetics.blue_mango, 0, 500);
        good.development = 25;
        bad.development = 25;
        good.updateStage();
        bad.updateStage();
        good.update(30_000, goodRoom.evaluate('vegetative'));
        bad.update(30_000, badRoom.evaluate('vegetative'));
        assert.ok(good.development > bad.development);
        assert.ok(good.stress < bad.stress);
        assert.ok(good.environmentScore > bad.environmentScore);
    });

    it('calculates quality on a 1-100 scale', () => {
        const p = new Plant(gameData.genetics.blue_mango, 0, 100);
        const quality = p.calculateQuality();
        assert.ok(quality >= 1 && quality <= 100);
    });

    it('preserves zero values, phenotype, and environment score through save/load', () => {
        const p = new Plant(gameData.genetics.blue_mango, 0, 424242);
        p.health = 0;
        p.vigor = 0;
        p.hydration = 0;
        p.development = 0;
        p.environmentScore = 0;
        const saved = p.save();
        const loaded = Plant.load(saved, gameData.genetics.blue_mango);
        assert.equal(loaded.health, 0);
        assert.equal(loaded.vigor, 0);
        assert.equal(loaded.hydration, 0);
        assert.equal(loaded.development, 0);
        assert.equal(loaded.environmentScore, 0);
        assert.deepEqual(loaded.phenotype, saved.phenotype);
    });

    it('caps a single simulation tick to limit clock-jump exploits', () => {
        const p = new Plant(gameData.genetics.blue_mango, 0, 100);
        p.update(3_600_000);
        assert.ok(p.development < 10);
        assert.ok(p.hydration > 70);
    });

    it('migrates pre-phenotype plants without rerolling their established vigor', () => {
        const genetics = gameData.genetics.blue_mango;
        const loaded = Plant.load({
            geneticsId: 'blue_mango',
            vigor: 77,
            health: 90,
            hydration: 60,
            development: 20,
            stress: 5,
            startTime: 1000
        }, genetics);
        assert.equal(loaded.vigor, 77);
        assert.equal(loaded.yieldPotential, genetics.yieldPotential);
        assert.equal(loaded.qualityPotential, genetics.qualityPotential);
        assert.equal(loaded.resilience, genetics.resilience);
    });
});

describe('Game', () => {
    it('creates a game and plants a valid seed', () => {
        const game = new Game('Test', gameData);
        game.inventory.add('seed', 'blue_mango', 1);
        assert.equal(game.plantSeed('blue_mango', 123), true);
        assert.ok(game.plant);
        assert.equal(game.inventory.get('seed', 'blue_mango'), 0);
        assert.equal(game.plant.phenotype.seed, 123);
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

    it('updates the plant through the current room environment', () => {
        const game = new Game('Test', gameData);
        game.inventory.add('seed', 'blue_mango', 1);
        game.plantSeed('blue_mango', 123);
        game.plant.development = 25;
        game.plant.updateStage();
        game.setEnvironment('temperature', 105);
        game.setEnvironment('humidity', 95);
        game.setEnvironment('light', 5);
        game.setEnvironment('ph', 8.5);
        game.setEnvironment('ec', 3.8);
        const start = game.plant.startTime;
        game.update(start + 30_000);
        assert.ok(game.plant.environmentScore < 45);
        assert.ok(game.plant.stress > 0);
    });

    it('tracks first-seed objectives and awards quest rewards exactly once', () => {
        const game = new Game('Test', gameData);
        assert.equal(game.startQuest('first_seed'), true);
        game.inventory.add('seed', 'blue_mango', 1);
        assert.equal(game.plantSeed('blue_mango', 123), true);
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

    it('round-trips version 4 saves with phenotype and environment state', () => {
        const game = new Game('Test', gameData);
        game.inventory.add('seed', 'blue_mango', 1);
        game.plantSeed('blue_mango', 987654321);
        game.plant.hydration = 0;
        game.setEnvironment('temperature', 81);
        game.setEnvironment('humidity', 55);
        game.setEnvironment('light', 72);
        game.setEnvironment('ph', 6.4);
        game.setEnvironment('ec', 1.3);
        const saved = game.save();
        assert.equal(saved.version, 4);
        assert.equal(saved.plant.geneticsId, 'blue_mango');
        assert.equal('genetics' in saved.plant, false);
        assert.equal(saved.plant.phenotype.seed, 987654321);
        const loaded = new Game('Other', gameData);
        loaded.load(saved);
        assert.equal(loaded.player.name, 'Test');
        assert.equal(loaded.plant.geneticsId, 'blue_mango');
        assert.equal(loaded.plant.hydration, 0);
        assert.deepEqual(loaded.plant.phenotype, saved.plant.phenotype);
        assert.deepEqual(loaded.environment.save(), saved.environment);
    });

    it('migrates version 3 saves into default environment state', () => {
        const source = new Game('V3', gameData);
        source.inventory.add('seed', 'blue_mango', 1);
        source.plantSeed('blue_mango', 55);
        const legacy = source.save();
        legacy.version = 3;
        delete legacy.environment;
        const game = new Game('Other', gameData);
        game.load(legacy);
        assert.deepEqual(game.environment.save(), new Environment().save());
        assert.equal(game.save().version, 4);
    });

    it('migrates version 2 saves into phenotype-aware version 4 saves', () => {
        const legacy = {
            version: 2,
            player: { name: 'V2', level: 1, xp: 0, xpToNext: 100, money: 125, reputation: 0 },
            inventory: { seed: {}, item: {}, harvest: {} },
            plant: { geneticsId: 'blue_mango', stage: 'seedling', age: 1, health: 95, vigor: 82, stress: 10, hydration: 40, development: 10, startTime: 0, lastUpdate: 0 },
            quests: { active: [], completed: [], progress: {} },
            location: 'grow_room',
            time: 0
        };
        const game = new Game('Test', gameData);
        game.load(legacy);
        assert.equal(game.plant.vigor, 82);
        assert.equal(game.plant.yieldPotential, gameData.genetics.blue_mango.yieldPotential);
        assert.equal(game.save().version, 4);
        assert.ok(game.save().plant.phenotype);
        assert.deepEqual(game.environment.save(), new Environment().save());
    });

    it('migrates version 1 money and embedded plant genetics', () => {
        const legacy = {
            version: 1,
            player: { name: 'Legacy', level: 1, xp: 0, xpToNext: 100, money: 50, reputation: 0 },
            inventory: { seed: {}, item: {}, harvest: {}, money: 175 },
            plant: { genetics: gameData.genetics.blue_mango, stage: 'seedling', age: 1, health: 0, vigor: 85, stress: 10, hydration: 0, development: 10, startTime: 0 },
            quests: { active: [], completed: [] },
            location: 'grow_room', time: 0
        };
        const game = new Game('Test', gameData);
        game.load(legacy);
        assert.equal(game.player.money, 175);
        assert.equal(game.plant.geneticsId, 'blue_mango');
        assert.equal(game.plant.health, 0);
        assert.equal(game.plant.hydration, 0);
        assert.equal(game.save().version, 4);
    });

    it('rejects unsupported save versions', () => {
        const game = new Game('Test', gameData);
        assert.throws(() => game.load({ version: 999 }), /Unsupported save version/);
    });
});
