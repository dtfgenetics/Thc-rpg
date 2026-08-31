import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../src/game/Game.js';
import { Equipment } from '../src/game/Equipment.js';
import { Environment } from '../src/game/Environment.js';

const gameData = JSON.parse(await readFile(new URL('../src/data/game-data.json', import.meta.url), 'utf8'));

describe('Advanced equipment', () => {
    it('counts owned tiers and applies bonuses from equipped slots only', () => {
        const equipment = new Equipment(gameData.equipment);
        assert.equal(equipment.getOwnedTierCount(2), 0);
        assert.equal(equipment.getEnvironmentScoreBonus(), 0);

        equipment.grant('adjustable_fixture', true);
        assert.equal(equipment.getEnvironmentScoreBonus(), 1);
        equipment.grant('precision_led_array', false);
        assert.equal(equipment.getOwnedTierCount(2), 1);
        assert.equal(equipment.getEnvironmentScoreBonus(), 1);
        equipment.equip('precision_led_array');
        assert.equal(equipment.getEnvironmentScoreBonus(), 3);

        equipment.grant('lab_monitor', true);
        assert.equal(equipment.getOwnedTierCount(2), 2);
        assert.equal(equipment.getEnvironmentScoreBonus(), 6);
    });

    it('raises the effective room score without mutating the raw environmental readings', () => {
        const environment = new Environment({ temperature: 82, humidity: 55, light: 55, ph: 6.8, ec: 1.6 });
        const base = environment.evaluate('vegetative');
        const boosted = environment.evaluate('vegetative', 6);
        assert.ok(boosted.score > base.score);
        assert.equal(boosted.baseScore, base.score);
        assert.equal(boosted.equipmentBonus, 6);
        assert.deepEqual(environment.save(), { temperature: 82, humidity: 55, light: 55, ph: 6.8, ec: 1.6 });
    });
});

describe('Phenotype Hunt', () => {
    it('grants retry seeds and keeps the best harvest-quality result across attempts', () => {
        const game = new Game('Selector', gameData);
        game.quests.completed.push('first_seed', 'dial_it_in');
        game.player.money = 1000;
        assert.equal(game.startQuest('phenotype_hunt'), true);
        assert.equal(game.inventory.get('seed', 'mango_bubbles'), 3);

        assert.equal(game.purchaseEquipment('lab_monitor'), true);
        assert.equal(game.purchaseEquipment('precision_led_array'), true);
        assert.equal(game.getQuestProgress('phenotype_hunt').objectives.find(o => o.id === 'advanced_gear').current, 2);

        assert.equal(game.plantSeed('mango_bubbles', 404), true);
        game.setEnvironment('temperature', 74);
        game.setEnvironment('humidity', 68);
        game.setEnvironment('light', 30);
        game.setEnvironment('ph', 6.2);
        game.setEnvironment('ec', 0.5);
        let now = game.plant.lastUpdate;
        for (let i = 0; i < 5; i += 1) {
            now += 3_000;
            game.update(now);
        }

        game.plant.stress = 100;
        game.plant.development = 100;
        game.plant.updateStage();
        const poor = game.harvest();
        assert.ok(poor.quality < 80);
        const afterPoor = game.getQuestProgress('phenotype_hunt');
        const poorQualityProgress = afterPoor.objectives.find(o => o.id === 'quality_mango_bubbles').current;
        assert.equal(afterPoor.objectives.find(o => o.id === 'quality_mango_bubbles').completed, false);
        assert.ok(poorQualityProgress > 0);

        assert.equal(game.plantSeed('mango_bubbles', 405), true);
        game.plant.health = 100;
        game.plant.stress = 0;
        game.plant.development = 100;
        game.plant.updateStage();
        const good = game.harvest();
        assert.ok(good.quality >= 80);
        const afterGood = game.getQuestProgress('phenotype_hunt');
        assert.equal(afterGood.objectives.find(o => o.id === 'quality_mango_bubbles').current, 80);
        assert.equal(afterGood.objectives.find(o => o.id === 'quality_mango_bubbles').completed, true);
        assert.ok(afterGood.objectives.find(o => o.id === 'quality_mango_bubbles').current >= poorQualityProgress);
        assert.equal(game.inventory.get('seed', 'mango_bubbles'), 1);
    });
});
