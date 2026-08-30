import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../src/game/Game.js';
import { Plant } from '../src/game/Plant.js';
import { Inventory } from '../src/game/Inventory.js';
import { Environment } from '../src/game/Environment.js';
import { Equipment } from '../src/game/Equipment.js';
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

    it('clamps environment controls to game bounds', () => {
        const environment = new Environment();
        environment.set('temperature', 999);
        environment.set('humidity', -20);
        environment.set('light', 200);
        environment.set('ph', 99);
        environment.set('ec', -1);
        assert.deepEqual(environment.save(), { temperature: 110, humidity: 10, light: 100, ph: 9, ec: 0 });
        assert.equal(environment.set('missing', 1), false);
    });
});

describe('Equipment', () => {
    it('grants and equips starter gear by slot', () => {
        const equipment = new Equipment(gameData.equipment);
        assert.equal(equipment.has('starter_fixture'), true);
        assert.equal(equipment.has('basic_ventilation'), true);
        assert.equal(equipment.has('basic_meter'), true);
        assert.equal(equipment.getEquipped('lighting').id, 'starter_fixture');
        assert.equal(equipment.getEquipped('climate').id, 'basic_ventilation');
        assert.equal(equipment.getEquipped('monitoring').id, 'basic_meter');
    });

    it('uses equipped gear to define control precision', () => {
        const equipment = new Equipment(gameData.equipment);
        assert.equal(equipment.getControlStep('light'), 10);
        assert.equal(equipment.getControlStep('temperature'), 5);
        assert.equal(equipment.getControlStep('humidity'), 10);
        assert.equal(equipment.getControlStep('ph'), 0.5);
        assert.equal(equipment.getControlStep('ec'), 0.5);
        equipment.grant('precision_meter', true);
        assert.equal(equipment.getControlStep('ph'), 0.1);
        assert.equal(equipment.getControlStep('ec'), 0.1);
    });

    it('sanitizes unknown gear and invalid equipped slots on load', () => {
        const equipment = new Equipment(gameData.equipment);
        equipment.load({
            owned: ['precision_meter', 'missing_item'],
            equipped: { lighting: 'precision_meter', monitoring: 'precision_meter', missing: 'missing_item' }
        });
        assert.equal(equipment.has('missing_item'), false);
        assert.equal(equipment.getEquipped('lighting').id, 'starter_fixture');
        assert.equal(equipment.getEquipped('monitoring').id, 'precision_meter');
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
    });

    it('preserves zero values, phenotype, and environment score through save/load', () => {
        const p = new Plant(gameData.genetics.blue_mango, 0, 424242);
        p.health = 0;
        p.vigor = 0;
        p.hydration = 0;
        p.environmentScore = 0;
        const loaded = Plant.load(p.save(), gameData.genetics.blue_mango);
        assert.equal(loaded.health, 0);
        assert.equal(loaded.vigor, 0);
        assert.equal(loaded.hydration, 0);
        assert.equal(loaded.environmentScore, 0);
        assert.equal(loaded.phenotype.seed, 424242);
    });

    it('caps a single simulation tick to limit clock-jump exploits', () => {
        const p = new Plant(gameData.genetics.blue_mango, 0, 100);
        p.update(3_600_000);
        assert.ok(p.development < 10);
        assert.ok(p.hydration > 70);
    });
});

describe('Game', () => {
    it('creates a game and plants a valid seed', () => {
        const game = new Game('Test', gameData);
        game.inventory.add('seed', 'blue_mango', 1);
        assert.equal(game.plantSeed('blue_mango', 123), true);
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

    it('purchases and auto-equips an affordable upgrade exactly once', () => {
        const game = new Game('Test', gameData);
        assert.equal(game.getEnvironmentControlStep('light'), 10);
        assert.equal(game.purchaseEquipment('adjustable_fixture'), true);
        assert.equal(game.player.money, 25);
        assert.equal(game.equipment.has('adjustable_fixture'), true);
        assert.equal(game.equipment.getEquipped('lighting').id, 'adjustable_fixture');
        assert.equal(game.getEnvironmentControlStep('light'), 5);
        assert.equal(game.purchaseEquipment('adjustable_fixture'), false);
        assert.equal(game.player.money, 25);
    });

    it('rejects unaffordable or unknown equipment without changing money', () => {
        const game = new Game('Test', gameData);
        game.player.money = 20;
        assert.equal(game.purchaseEquipment('climate_module'), false);
        assert.equal(game.purchaseEquipment('missing_item'), false);
        assert.equal(game.player.money, 20);
        assert.equal(game.equipment.has('climate_module'), false);
    });

    it('uses equipped precision when nudging room controls', () => {
        const game = new Game('Test', gameData);
        const start = game.environment.temperature;
        assert.equal(game.nudgeEnvironment('temperature', 1), true);
        assert.equal(game.environment.temperature, start + 5);
        game.player.money = 100;
        assert.equal(game.purchaseEquipment('climate_module'), true);
        const upgraded = game.environment.temperature;
        assert.equal(game.nudgeEnvironment('temperature', -1), true);
        assert.equal(game.environment.temperature, upgraded - 2);
        assert.equal(game.nudgeEnvironment('temperature', 0), false);
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
        game.update(game.plant.startTime + 30_000);
        assert.ok(game.plant.environmentScore < 45);
        assert.ok(game.plant.stress > 0);
    });

    it('tracks first-seed objectives and awards quest rewards exactly once', () => {
        const game = new Game('Test', gameData);
        assert.equal(game.startQuest('first_seed'), true);
        game.inventory.add('seed', 'blue_mango', 1);
        game.plantSeed('blue_mango', 123);
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
    });

    it('round-trips version 5 saves with environment, phenotype, and equipment', () => {
        const game = new Game('Test', gameData);
        game.player.money = 200;
        assert.equal(game.purchaseEquipment('precision_meter'), true);
        assert.equal(game.purchaseEquipment('adjustable_fixture'), true);
        game.inventory.add('seed', 'blue_mango', 1);
        game.plantSeed('blue_mango', 987654321);
        game.setEnvironment('temperature', 81);
        const saved = game.save();
        assert.equal(saved.version, 5);
        assert.equal(saved.equipment.equipped.monitoring, 'precision_meter');
        assert.equal(saved.equipment.equipped.lighting, 'adjustable_fixture');

        const loaded = new Game('Other', gameData);
        loaded.load(saved);
        assert.equal(loaded.player.name, 'Test');
        assert.equal(loaded.plant.phenotype.seed, 987654321);
        assert.deepEqual(loaded.environment.save(), saved.environment);
        assert.deepEqual(loaded.equipment.save(), saved.equipment);
        assert.equal(loaded.getEnvironmentControlStep('ph'), 0.1);
        assert.equal(loaded.getEnvironmentControlStep('light'), 5);
    });

    it('migrates version 4 saves to starter equipment without charging the player', () => {
        const source = new Game('V4', gameData);
        const legacy = source.save();
        legacy.version = 4;
        delete legacy.equipment;
        legacy.player.money = 77;

        const game = new Game('Other', gameData);
        game.load(legacy);
        assert.equal(game.player.money, 77);
        assert.equal(game.equipment.getEquipped('lighting').id, 'starter_fixture');
        assert.equal(game.equipment.getEquipped('climate').id, 'basic_ventilation');
        assert.equal(game.equipment.getEquipped('monitoring').id, 'basic_meter');
        assert.equal(game.save().version, 5);
    });

    it('migrates version 3 saves into default environment and starter equipment', () => {
        const source = new Game('V3', gameData);
        const legacy = source.save();
        legacy.version = 3;
        delete legacy.environment;
        delete legacy.equipment;
        const game = new Game('Other', gameData);
        game.load(legacy);
        assert.deepEqual(game.environment.save(), new Environment().save());
        assert.equal(game.equipment.has('starter_fixture'), true);
        assert.equal(game.save().version, 5);
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
        assert.equal(game.save().version, 5);
    });

    it('rejects unsupported save versions', () => {
        const game = new Game('Test', gameData);
        assert.throws(() => game.load({ version: 999 }), /Unsupported save version/);
    });
});
