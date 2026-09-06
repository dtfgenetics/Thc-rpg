import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../src/game/Game.js';
import { GrowJournal } from '../src/game/GrowJournal.js';

const gameData = JSON.parse(await readFile(new URL('../src/data/game-data.json', import.meta.url), 'utf8'));

function harvestReadyGame(seed = 123456) {
    const game = new Game('Journal Tester', gameData);
    game.inventory.add('seed', 'blue_mango', 1);
    assert.equal(game.plantSeed('blue_mango', seed), true);
    game.plant.development = 100;
    game.plant.updateStage();
    game.time = 1_800_000;
    return game;
}

describe('GrowJournal', () => {
    it('records a defensive phenotype snapshot and toggles keeper state', () => {
        const game = harvestReadyGame(424242);
        const plant = game.plant;
        const journal = new GrowJournal();
        const entry = journal.record({ plant, yieldAmount: 18, quality: 87, harvestedAt: 1234 });

        assert.equal(entry.geneticsId, 'blue_mango');
        assert.equal(entry.phenotypeSeed, 424242);
        assert.equal(entry.yield, 18);
        assert.equal(entry.quality, 87);
        assert.equal(entry.keeper, false);
        assert.deepEqual(entry.dominantTraits, plant.dominantTraits);

        entry.quality = 1;
        assert.equal(journal.get(entry.id).quality, 87, 'Returned records must not mutate journal state.');
        assert.equal(journal.toggleKeeper(entry.id, true), true);
        assert.equal(journal.get(entry.id).keeper, true);
    });

    it('sanitizes invalid records, removes duplicate IDs, and caps history', () => {
        const records = Array.from({ length: 60 }, (_, index) => ({
            id: `record-${Math.min(index, 55)}`,
            geneticsId: 'blue_mango',
            plantName: 'Blue Mango',
            phenotypeSeed: index,
            dominantTraits: ['sweet_terp', 'sweet_terp', null],
            vigor: 999,
            yieldPotential: 50,
            qualityPotential: 50,
            resilience: 50,
            floweringDays: 0,
            finalHealth: -5,
            finalStress: 20,
            finalEnvironmentScore: 75,
            yield: index,
            quality: 101,
            harvestedAt: index
        }));
        records.push({ id: 'broken' });

        const journal = new GrowJournal(records);
        const saved = journal.save();
        assert.equal(saved.length, 50);
        assert.equal(new Set(saved.map(record => record.id)).size, saved.length);
        assert.equal(saved[0].vigor, 100);
        assert.equal(saved[0].quality, 100);
        assert.equal(saved[0].finalHealth, 0);
        assert.equal(saved[0].floweringDays, 1);
        assert.deepEqual(saved[0].dominantTraits, ['sweet_terp']);
    });
});

describe('Game grow journal integration', () => {
    it('records the harvested phenotype before clearing the live plant', () => {
        const game = harvestReadyGame(987654321);
        const phenotype = game.plant.phenotype;
        const traits = game.plant.dominantTraits;
        const result = game.harvest();

        assert.ok(result);
        assert.equal(game.plant, null);
        assert.equal(result.journalEntry.phenotypeSeed, 987654321);
        assert.deepEqual(result.journalEntry.dominantTraits, traits);
        assert.equal(result.journalEntry.vigor, phenotype.vigor);
        assert.equal(game.getGrowJournal().length, 1);
        assert.equal(game.getGrowJournal()[0].id, result.journalEntry.id);
    });

    it('persists keeper selections through version 6 save/load', () => {
        const game = harvestReadyGame(111222333);
        const result = game.harvest();
        assert.equal(game.toggleGrowJournalKeeper(result.journalEntry.id, true), true);

        const saved = game.save();
        assert.equal(saved.version, 6);
        assert.equal(saved.growJournal[0].keeper, true);

        const loaded = new Game('Other', gameData);
        loaded.load(saved);
        assert.equal(loaded.getGrowJournal().length, 1);
        assert.equal(loaded.getGrowJournal()[0].phenotypeSeed, 111222333);
        assert.equal(loaded.getGrowJournal()[0].keeper, true);
    });

    it('migrates version 5 saves to an empty journal without losing other state', () => {
        const source = new Game('Legacy V5', gameData);
        source.player.money = 333;
        const legacy = source.save();
        legacy.version = 5;
        delete legacy.growJournal;

        const loaded = new Game('Other', gameData);
        loaded.load(legacy);
        assert.equal(loaded.player.money, 333);
        assert.deepEqual(loaded.getGrowJournal(), []);
        assert.equal(loaded.save().version, 6);
    });
});
