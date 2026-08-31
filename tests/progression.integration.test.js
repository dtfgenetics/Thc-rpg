import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../src/game/Game.js';

const gameData = JSON.parse(await readFile(new URL('../src/data/game-data.json', import.meta.url), 'utf8'));

it('plays through both current quest chapters across a save/load boundary', () => {
    const game = new Game('Integration Grower', gameData);

    assert.equal(game.startQuest('first_seed'), true);
    game.inventory.add('seed', 'blue_mango', 1);
    assert.equal(game.plantSeed('blue_mango', 101), true);
    game.plant.development = 100;
    game.plant.updateStage();
    assert.equal(game.plant.stage, 'harvest_ready');
    assert.ok(game.harvest());
    assert.equal(game.completeQuest('first_seed'), true);
    assert.equal(game.inventory.get('seed', 'blue_bubblegum'), 2);
    assert.deepEqual(game.getAvailableQuests().map(quest => quest.id), ['dial_it_in']);

    assert.equal(game.startQuest('dial_it_in'), true);
    assert.equal(game.purchaseEquipment('precision_meter'), true);
    assert.equal(game.plantSeed('blue_bubblegum', 202), true);

    game.setEnvironment('temperature', 74);
    game.setEnvironment('humidity', 68);
    game.setEnvironment('light', 30);
    game.setEnvironment('ph', 6.2);
    game.setEnvironment('ec', 0.5);

    let now = game.plant.lastUpdate;
    for (let i = 0; i < 3; i += 1) {
        now += 3_000;
        game.update(now);
    }

    const midQuest = game.getQuestProgress('dial_it_in');
    assert.equal(midQuest.objectives.find(objective => objective.id === 'buy_upgrade').completed, true);
    assert.equal(midQuest.objectives.find(objective => objective.id === 'stabilize_room').current, 3);
    assert.equal(midQuest.objectives.find(objective => objective.id === 'plant_blue_bubblegum').completed, true);

    const restored = new Game('Other', gameData);
    restored.load(game.save());
    assert.equal(restored.player.name, 'Integration Grower');
    assert.equal(restored.equipment.has('precision_meter'), true);
    assert.equal(restored.plant.geneticsId, 'blue_bubblegum');
    assert.equal(restored.getQuestProgress('dial_it_in').objectives.find(objective => objective.id === 'stabilize_room').current, 3);

    restored.plant.development = 100;
    restored.plant.updateStage();
    assert.ok(restored.harvest());
    assert.equal(restored.isQuestReady('dial_it_in'), true);
    assert.equal(restored.completeQuest('dial_it_in'), true);
    assert.equal(restored.quests.completed.includes('dial_it_in'), true);
    assert.equal(restored.inventory.get('item', 'nutrients'), 2);
    assert.equal(restored.getAvailableQuests().length, 0);
});
