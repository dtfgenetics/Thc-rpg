import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../src/game/Game.js';

const gameData = JSON.parse(await readFile(new URL('../src/data/game-data.json', import.meta.url), 'utf8'));

function completeFirstSeed(game) {
    assert.equal(game.startQuest('first_seed'), true);
    game.inventory.add('seed', 'blue_mango', 1);
    assert.equal(game.plantSeed('blue_mango', 101), true);
    game.plant.development = 100;
    game.plant.updateStage();
    assert.ok(game.harvest());
    assert.equal(game.completeQuest('first_seed'), true);
}

describe('Quest chain', () => {
    it('blocks quests whose prerequisites are not completed', () => {
        const game = new Game('Quest Test', gameData);
        assert.equal(game.areQuestPrerequisitesMet('dial_it_in'), false);
        assert.equal(game.startQuest('dial_it_in'), false);
        assert.deepEqual(game.getAvailableQuests().map(quest => quest.id), ['first_seed']);
    });

    it('unlocks Dial It In after The First Seed', () => {
        const game = new Game('Quest Test', gameData);
        completeFirstSeed(game);
        assert.equal(game.areQuestPrerequisitesMet('dial_it_in'), true);
        assert.deepEqual(game.getAvailableQuests().map(quest => quest.id), ['dial_it_in']);
        const first = game.getQuestProgress('first_seed');
        assert.equal(first.completed, true);
        assert.equal(first.nextQuest, 'dial_it_in');
    });

    it('retro-credits an upgrade owned before the second quest begins', () => {
        const game = new Game('Quest Test', gameData);
        game.player.money = 300;
        assert.equal(game.purchaseEquipment('adjustable_fixture'), true);
        completeFirstSeed(game);
        assert.equal(game.startQuest('dial_it_in'), true);
        const state = game.getQuestProgress('dial_it_in');
        const upgrade = state.objectives.find(objective => objective.id === 'buy_upgrade');
        assert.equal(upgrade.completed, true);
        assert.equal(upgrade.current, 1);
    });

    it('records equipment purchases made while the quest is active', () => {
        const game = new Game('Quest Test', gameData);
        completeFirstSeed(game);
        assert.equal(game.startQuest('dial_it_in'), true);
        assert.equal(game.purchaseEquipment('precision_meter'), true);
        const state = game.getQuestProgress('dial_it_in');
        assert.equal(state.objectives.find(objective => objective.id === 'buy_upgrade').completed, true);
    });

    it('records good room simulation checks while a plant is active', () => {
        const game = new Game('Quest Test', gameData);
        completeFirstSeed(game);
        assert.equal(game.startQuest('dial_it_in'), true);
        assert.equal(game.plantSeed('blue_bubblegum', 202), true);

        game.setEnvironment('temperature', 74);
        game.setEnvironment('humidity', 68);
        game.setEnvironment('light', 30);
        game.setEnvironment('ph', 6.2);
        game.setEnvironment('ec', 0.5);

        const base = game.plant.lastUpdate;
        game.update(base + 3_000);
        game.update(base + 6_000);
        game.update(base + 9_000);

        const state = game.getQuestProgress('dial_it_in');
        const room = state.objectives.find(objective => objective.id === 'stabilize_room');
        assert.equal(room.current, 3);
        assert.equal(room.completed, true);
    });

    it('completes the full second quest, awards rewards once, and unlocks Phenotype Hunt', () => {
        const game = new Game('Quest Test', gameData);
        completeFirstSeed(game);
        assert.equal(game.inventory.get('seed', 'blue_bubblegum'), 2);
        assert.equal(game.startQuest('dial_it_in'), true);
        assert.equal(game.purchaseEquipment('precision_meter'), true);
        assert.equal(game.plantSeed('blue_bubblegum', 303), true);

        game.setEnvironment('temperature', 74);
        game.setEnvironment('humidity', 68);
        game.setEnvironment('light', 30);
        game.setEnvironment('ph', 6.2);
        game.setEnvironment('ec', 0.5);
        const base = game.plant.lastUpdate;
        game.update(base + 3_000);
        game.update(base + 6_000);
        game.update(base + 9_000);

        game.plant.development = 100;
        game.plant.updateStage();
        assert.ok(game.harvest());
        assert.equal(game.isQuestReady('dial_it_in'), true);

        const beforeMoney = game.player.money;
        const beforeNutrients = game.inventory.get('item', 'nutrients');
        assert.deepEqual(game.completeReadyQuests(), ['dial_it_in']);
        assert.equal(game.player.money, beforeMoney + 100);
        assert.equal(game.inventory.get('item', 'nutrients'), beforeNutrients + 2);
        assert.equal(game.completeQuest('dial_it_in'), false);
        assert.deepEqual(game.quests.completed, ['first_seed', 'dial_it_in']);
        assert.deepEqual(game.getAvailableQuests().map(quest => quest.id), ['phenotype_hunt']);
    });

    it('filters stale quest ids when loading a save', () => {
        const source = new Game('Quest Test', gameData);
        const save = source.save();
        save.quests.active = ['missing_quest', 'first_seed'];
        save.quests.completed = ['also_missing'];
        save.quests.progress = { first_seed: {} };

        const loaded = new Game('Loaded', gameData);
        loaded.load(save);
        assert.deepEqual(loaded.quests.active, ['first_seed']);
        assert.deepEqual(loaded.quests.completed, []);
    });
});
