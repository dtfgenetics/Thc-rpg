import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../src/game/Game.js';
import { archiveKeeperCutting, plantKeeperCutting } from '../src/game/KeeperCuttings.js';

const gameData = JSON.parse(await readFile(new URL('../src/data/game-data.json', import.meta.url), 'utf8'));

function tuneSeedRoom(game) {
    game.setEnvironment('temperature', 74);
    game.setEnvironment('humidity', 68);
    game.setEnvironment('light', 30);
    game.setEnvironment('ph', 6.2);
    game.setEnvironment('ec', 0.5);
}

function advanceGoodChecks(game, count) {
    let now = game.plant.lastUpdate;
    for (let i = 0; i < count; i += 1) {
        now += 3_000;
        game.update(now);
    }
    return now;
}

function makeHighQualityHarvestReady(game) {
    game.plant.phenotype.qualityPotential = 100;
    game.plant.health = 100;
    game.plant.stress = 0;
    game.plant.environmentScore = 100;
    game.plant.development = 100;
    game.plant.updateStage();
}

it('plays through all current quest chapters across save/load boundaries', () => {
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
    tuneSeedRoom(game);
    advanceGoodChecks(game, 3);

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
    assert.equal(restored.inventory.get('item', 'nutrients'), 2);
    assert.deepEqual(restored.getAvailableQuests().map(quest => quest.id), ['phenotype_hunt']);

    assert.equal(restored.startQuest('phenotype_hunt'), true);
    assert.equal(restored.inventory.get('seed', 'mango_bubbles'), 3);
    assert.equal(restored.purchaseEquipment('lab_monitor'), true);
    assert.equal(restored.purchaseEquipment('precision_led_array'), true);
    assert.equal(restored.equipment.getOwnedTierCount(2), 2);
    assert.equal(restored.plantSeed('mango_bubbles', 303), true);
    tuneSeedRoom(restored);
    advanceGoodChecks(restored, 5);

    const advanced = restored.getQuestProgress('phenotype_hunt');
    assert.equal(advanced.objectives.find(objective => objective.id === 'advanced_gear').current, 2);
    assert.equal(advanced.objectives.find(objective => objective.id === 'stabilize_advanced_room').current, 5);
    assert.equal(advanced.objectives.find(objective => objective.id === 'plant_mango_bubbles').completed, true);

    const chapterThreeSave = restored.save();
    const finalGame = new Game('Final', gameData);
    finalGame.load(chapterThreeSave);
    makeHighQualityHarvestReady(finalGame);
    const mangoHarvest = finalGame.harvest();
    assert.ok(mangoHarvest);
    assert.ok(mangoHarvest.quality >= 80);
    assert.equal(finalGame.isQuestReady('phenotype_hunt'), true);
    assert.equal(finalGame.completeQuest('phenotype_hunt'), true);
    assert.equal(finalGame.inventory.get('seed', 'mango_bubbles'), 4);
    assert.equal(finalGame.inventory.get('item', 'nutrients'), 5);
    assert.deepEqual(finalGame.getAvailableQuests().map(quest => quest.id), ['keeper_standard']);

    assert.equal(finalGame.startQuest('keeper_standard'), true);
    const recordId = mangoHarvest.journalEntry.id;
    assert.equal(finalGame.toggleGrowJournalKeeper(recordId, true), true);
    assert.equal(archiveKeeperCutting(finalGame, recordId).ok, true);
    assert.equal(finalGame.isQuestReady('keeper_standard'), true);
    assert.equal(finalGame.completeQuest('keeper_standard'), true);
    assert.deepEqual(finalGame.getAvailableQuests().map(quest => quest.id), ['clone_proof']);

    const chapterFourSave = finalGame.save();
    const cloneGame = new Game('Clone', gameData);
    cloneGame.load(chapterFourSave);
    assert.equal(cloneGame.startQuest('clone_proof'), true);
    const plantedClone = plantKeeperCutting(cloneGame, recordId, 5_000);
    assert.equal(plantedClone.ok, true);
    assert.equal(cloneGame.plant.phenotype.seed, mangoHarvest.journalEntry.phenotypeSeed);
    tuneSeedRoom(cloneGame);
    advanceGoodChecks(cloneGame, 6);
    makeHighQualityHarvestReady(cloneGame);
    const cloneHarvest = cloneGame.harvest();
    assert.ok(cloneHarvest.quality >= 82);
    assert.equal(cloneGame.isQuestReady('clone_proof'), true);
    assert.equal(cloneGame.completeQuest('clone_proof'), true);
    assert.equal(cloneGame.inventory.get('seed', 'zestberry'), 3);
    assert.deepEqual(cloneGame.getAvailableQuests().map(quest => quest.id), ['zestberry_trial']);

    assert.equal(cloneGame.startQuest('zestberry_trial'), true);
    assert.equal(cloneGame.equipment.grant('environment_controller', true), true);
    cloneGame.syncQuestProgress('zestberry_trial');
    assert.equal(cloneGame.equipment.getOwnedTierCount(2), 3);
    assert.equal(cloneGame.plantSeed('zestberry', 404), true);
    tuneSeedRoom(cloneGame);
    advanceGoodChecks(cloneGame, 8);
    makeHighQualityHarvestReady(cloneGame);
    const zestberryHarvest = cloneGame.harvest();
    assert.ok(zestberryHarvest.quality >= 84);
    assert.equal(cloneGame.isQuestReady('zestberry_trial'), true);
    assert.equal(cloneGame.completeQuest('zestberry_trial'), true);
    assert.equal(cloneGame.getAvailableQuests().length, 0);
    assert.ok(cloneGame.quests.completed.includes('zestberry_trial'));
});
