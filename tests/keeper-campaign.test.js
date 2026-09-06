import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../src/game/Game.js';
import { archiveKeeperCutting, plantKeeperCutting } from '../src/game/KeeperCuttings.js';
import { KEEPER_CAMPAIGN_QUESTS, ZESTBERRY_GENETICS } from '../src/game/CampaignChapters.js';

const baseGameData = JSON.parse(await readFile(new URL('../src/data/game-data.json', import.meta.url), 'utf8'));

function makeHarvestReady(game, qualityPotential = 100) {
    assert.ok(game.plant, 'a plant is required');
    game.plant.phenotype.qualityPotential = qualityPotential;
    game.plant.health = 100;
    game.plant.stress = 0;
    game.plant.environmentScore = 100;
    game.plant.development = 100;
    game.plant.updateStage();
    assert.equal(game.plant.stage, 'harvest_ready');
}

function completeChecks(game, count) {
    for (let index = 0; index < count; index += 1) game.recordObjective('maintain_environment_status', 'good');
}

describe('THC RPG Keeper campaign expansion', () => {
    it('extends the three-chapter campaign without mutating base game data', () => {
        const game = new Game('Campaign Tester', baseGameData);
        assert.equal(Object.keys(baseGameData.quests).length, 3);
        assert.equal(baseGameData.quests.phenotype_hunt.nextQuest, null);
        assert.equal(Object.keys(game.gameData.quests).length, 6);
        assert.equal(game.gameData.quests.phenotype_hunt.nextQuest, 'keeper_standard');
        assert.deepEqual(game.gameData.quests.keeper_standard, KEEPER_CAMPAIGN_QUESTS.keeper_standard);
        assert.deepEqual(game.gameData.genetics.zestberry, ZESTBERRY_GENETICS);
        assert.equal(game.gameData.schemaVersion, 7);
    });

    it('completes Keeper Standard through real journal and cutting events', () => {
        const game = new Game('Keeper Standard Tester', baseGameData);
        game.quests.completed = ['first_seed', 'dial_it_in', 'phenotype_hunt'];
        assert.equal(game.startQuest('keeper_standard'), true);

        game.inventory.add('seed', 'mango_bubbles', 1);
        assert.equal(game.plantSeed('mango_bubbles', 246813579), true);
        makeHarvestReady(game);
        const harvested = game.harvest();
        assert.ok(harvested?.journalEntry);
        const recordId = harvested.journalEntry.id;

        assert.equal(game.toggleGrowJournalKeeper(recordId, true), true);
        let progress = game.getQuestProgress('keeper_standard');
        assert.equal(progress.objectives.find(item => item.id === 'select_mango_keeper').completed, true);
        assert.equal(progress.objectives.find(item => item.id === 'archive_mango_cutting').completed, false);

        const archived = archiveKeeperCutting(game, recordId);
        assert.equal(archived.ok, true);
        progress = game.getQuestProgress('keeper_standard');
        assert.equal(progress.objectives.every(item => item.completed), true);
        assert.equal(game.completeQuest('keeper_standard'), true);
        assert.ok(game.quests.completed.includes('keeper_standard'));
        assert.ok(game.getAvailableQuests().some(quest => quest.id === 'clone_proof'));
    });

    it('turns the exact Keeper phenotype into Clone Proof progression and unlocks Zestberry', () => {
        const game = new Game('Clone Proof Tester', baseGameData);
        game.quests.completed = ['first_seed', 'dial_it_in', 'phenotype_hunt', 'keeper_standard'];

        game.inventory.add('seed', 'mango_bubbles', 1);
        assert.equal(game.plantSeed('mango_bubbles', 99887766), true);
        makeHarvestReady(game);
        const keeperHarvest = game.harvest();
        const recordId = keeperHarvest.journalEntry.id;
        assert.equal(game.toggleGrowJournalKeeper(recordId, true), true);
        assert.equal(archiveKeeperCutting(game, recordId).ok, true);

        assert.equal(game.startQuest('clone_proof'), true);
        const planted = plantKeeperCutting(game, recordId, 5000);
        assert.equal(planted.ok, true);
        assert.equal(game.plant.phenotype.seed, 99887766);
        completeChecks(game, 6);
        makeHarvestReady(game);
        const cloneHarvest = game.harvest();
        assert.ok(cloneHarvest.quality >= 82);
        assert.equal(game.isQuestReady('clone_proof'), true);
        assert.equal(game.completeQuest('clone_proof'), true);
        assert.equal(game.inventory.get('seed', 'zestberry'), 3);
        assert.ok(game.getAvailableQuests().some(quest => quest.id === 'zestberry_trial'));
    });

    it('finishes the Zestberry Trial with a full advanced room and quality target', () => {
        const game = new Game('Zestberry Tester', baseGameData);
        game.quests.completed = ['first_seed', 'dial_it_in', 'phenotype_hunt', 'keeper_standard', 'clone_proof'];
        game.inventory.add('seed', 'zestberry', 1);
        assert.equal(game.startQuest('zestberry_trial'), true);
        assert.equal(game.plantSeed('zestberry', 1357911), true);

        for (const equipmentId of ['precision_led_array', 'environment_controller', 'lab_monitor']) {
            assert.equal(game.equipment.grant(equipmentId, true), true);
        }
        game.syncQuestProgress('zestberry_trial');
        completeChecks(game, 8);
        makeHarvestReady(game);
        const result = game.harvest();
        assert.ok(result.quality >= 84);
        assert.equal(game.isQuestReady('zestberry_trial'), true);
        assert.equal(game.completeQuest('zestberry_trial'), true);
        assert.ok(game.quests.completed.includes('zestberry_trial'));
        assert.equal(game.gameData.quests.zestberry_trial.nextQuest, null);
    });

    it('reconstructs existing keeper/cutting progress when a quest starts after the stock already exists', () => {
        const game = new Game('Recovery Tester', baseGameData);
        game.inventory.add('seed', 'mango_bubbles', 1);
        game.plantSeed('mango_bubbles', 42424242);
        makeHarvestReady(game);
        const result = game.harvest();
        const recordId = result.journalEntry.id;
        game.toggleGrowJournalKeeper(recordId, true);
        archiveKeeperCutting(game, recordId);

        game.quests.completed = ['first_seed', 'dial_it_in', 'phenotype_hunt'];
        assert.equal(game.startQuest('keeper_standard'), true);
        const progress = game.getQuestProgress('keeper_standard');
        assert.equal(progress.objectives.every(item => item.completed), true);
    });
});
