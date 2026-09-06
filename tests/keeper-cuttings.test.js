import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../src/game/Game.js';
import {
    archiveKeeperCutting,
    canArchiveKeeperCutting,
    canPlantKeeperCutting,
    plantKeeperCutting
} from '../src/game/KeeperCuttings.js';

const gameData = JSON.parse(await readFile(new URL('../src/data/game-data.json', import.meta.url), 'utf8'));

function createKeeperGame(seed = 246813579) {
    const game = new Game('Keeper Tester', gameData);
    game.inventory.add('seed', 'blue_mango', 1);
    assert.equal(game.plantSeed('blue_mango', seed), true);
    game.plant.development = 100;
    game.plant.updateStage();
    const harvested = game.harvest();
    assert.ok(harvested?.journalEntry);
    assert.equal(game.toggleGrowJournalKeeper(harvested.journalEntry.id, true), true);
    return { game, record: game.growJournal.get(harvested.journalEntry.id) };
}

describe('Keeper cuttings', () => {
    it('requires a marked Keeper before propagating stock', () => {
        const game = new Game('Selection Tester', gameData);
        game.inventory.add('seed', 'blue_mango', 1);
        game.plantSeed('blue_mango', 1234);
        game.plant.development = 100;
        game.plant.updateStage();
        const harvested = game.harvest();

        const eligibility = canArchiveKeeperCutting(game, harvested.journalEntry.id);
        assert.equal(eligibility.ok, false);
        assert.equal(eligibility.reason, 'keeper_required');
        assert.equal(archiveKeeperCutting(game, harvested.journalEntry.id).ok, false);
        assert.equal(game.inventory.get('clone', harvested.journalEntry.id), 0);
    });

    it('propagates multiple cuttings from preserved Keeper stock', () => {
        const { game, record } = createKeeperGame();
        assert.equal(archiveKeeperCutting(game, record.id).ok, true);
        const second = archiveKeeperCutting(game, record.id);
        assert.equal(second.ok, true);
        assert.equal(second.count, 2);
        assert.equal(game.inventory.get('clone', record.id), 2);
    });

    it('plants a cutting with the exact saved phenotype seed and consumes one cutting', () => {
        const { game, record } = createKeeperGame(99887766);
        archiveKeeperCutting(game, record.id);
        archiveKeeperCutting(game, record.id);

        const planted = plantKeeperCutting(game, record.id, 555000);
        assert.equal(planted.ok, true);
        assert.equal(game.plant.geneticsId, record.geneticsId);
        assert.equal(game.plant.phenotype.seed, record.phenotypeSeed);
        assert.equal(game.plant.phenotype.seed, 99887766);
        assert.deepEqual(game.plant.dominantTraits, record.dominantTraits);
        assert.equal(game.inventory.get('clone', record.id), 1);
        assert.equal(game.time, 555000);
    });

    it('blocks planting outside the Grow Room, into occupied space, or without stock', () => {
        const { game, record } = createKeeperGame();

        let result = canPlantKeeperCutting(game, record.id);
        assert.equal(result.ok, false);
        assert.equal(result.reason, 'cutting_required');

        archiveKeeperCutting(game, record.id);
        game.location = 'main_street';
        result = canPlantKeeperCutting(game, record.id);
        assert.equal(result.ok, false);
        assert.equal(result.reason, 'grow_room_required');
        assert.equal(game.inventory.get('clone', record.id), 1);

        game.location = 'grow_room';
        game.inventory.add('seed', 'blue_bubblegum', 1);
        assert.equal(game.plantSeed('blue_bubblegum', 55), true);
        result = plantKeeperCutting(game, record.id);
        assert.equal(result.ok, false);
        assert.equal(result.reason, 'grow_space_occupied');
        assert.equal(game.inventory.get('clone', record.id), 1);
    });

    it('persists clone inventory through the existing save version without a schema bump', () => {
        const { game, record } = createKeeperGame();
        archiveKeeperCutting(game, record.id);
        const saved = game.save();
        assert.equal(saved.version, 6);
        assert.equal(saved.inventory.clone[record.id], 1);

        const loaded = new Game('Loaded', gameData);
        loaded.load(saved);
        assert.equal(loaded.inventory.get('clone', record.id), 1);
        const planted = plantKeeperCutting(loaded, record.id, 999);
        assert.equal(planted.ok, true);
        assert.equal(loaded.plant.phenotype.seed, record.phenotypeSeed);
    });
});
