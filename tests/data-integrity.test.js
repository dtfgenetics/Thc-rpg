import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const gameData = JSON.parse(await readFile(resolve(root, 'src/data/game-data.json'), 'utf8'));

function assertCatalogKeys(sectionName, catalog) {
    for (const [key, value] of Object.entries(catalog || {})) {
        assert.equal(value.id, key, `${sectionName}.${key} must use the same id as its object key`);
    }
}

function validateItemMap(items, context) {
    for (const [category, entries] of Object.entries(items || {})) {
        for (const id of Object.keys(entries || {})) {
            if (category === 'seed' || category === 'seeds') {
                assert.ok(gameData.genetics[id], `${context} references missing genetics ${id}`);
            } else if (category === 'item') {
                assert.ok(gameData.items[id], `${context} references missing item ${id}`);
            } else {
                assert.fail(`${context} uses unsupported reward/start-item category ${category}`);
            }
        }
    }
}

describe('Static entrypoint integrity', () => {
    it('only references local scripts and stylesheets that exist', async () => {
        const html = await readFile(resolve(root, 'index.html'), 'utf8');
        const refs = [...html.matchAll(/(?:src|href)=["'](\.\/[^"'#?]+)["']/g)].map(match => match[1]);
        assert.ok(refs.length > 0, 'index.html should contain local assets');
        for (const ref of refs) {
            await assert.doesNotReject(access(resolve(root, ref.slice(2))), `Missing local asset ${ref}`);
        }
    });

    it('keeps the browser game-data JSON in the expected module-relative location', async () => {
        await assert.doesNotReject(access(resolve(root, 'src/data/game-data.json')));
    });
});

describe('Game data integrity', () => {
    it('keeps catalog keys and ids aligned', () => {
        assertCatalogKeys('genetics', gameData.genetics);
        assertCatalogKeys('quests', gameData.quests);
        assertCatalogKeys('items', gameData.items);
        assertCatalogKeys('equipment', gameData.equipment);
        assertCatalogKeys('npcs', gameData.npcs);
        assertCatalogKeys('locations', gameData.locations);
    });

    it('keeps quest prerequisites, next quests, targets, and grants resolvable', () => {
        for (const quest of Object.values(gameData.quests || {})) {
            for (const prerequisite of quest.prerequisites || []) {
                assert.ok(gameData.quests[prerequisite], `${quest.id} prerequisite ${prerequisite} is missing`);
                assert.notEqual(prerequisite, quest.id, `${quest.id} cannot require itself`);
            }
            if (quest.nextQuest) assert.ok(gameData.quests[quest.nextQuest], `${quest.id} nextQuest ${quest.nextQuest} is missing`);

            for (const objective of quest.objectives || []) {
                assert.ok(objective.id, `${quest.id} has an objective without an id`);
                assert.ok(Number(objective.required ?? 1) > 0, `${quest.id}.${objective.id} must require a positive amount`);
                if (['plant_seed', 'harvest_plant', 'harvest_quality'].includes(objective.type)) {
                    assert.ok(gameData.genetics[objective.target], `${quest.id}.${objective.id} targets missing genetics ${objective.target}`);
                }
                if (objective.type === 'purchase_equipment' && objective.target) {
                    assert.ok(gameData.equipment[objective.target], `${quest.id}.${objective.id} targets missing equipment ${objective.target}`);
                }
                if (objective.type === 'maintain_environment_status') {
                    assert.ok(['good', 'warning', 'danger'].includes(objective.target), `${quest.id}.${objective.id} uses invalid environment status ${objective.target}`);
                }
            }

            validateItemMap(quest.startItems, `${quest.id}.startItems`);
            validateItemMap(quest.rewards?.items, `${quest.id}.rewards.items`);
        }
    });

    it('keeps equipment definitions internally valid', () => {
        const allowedSlots = new Set(['lighting', 'climate', 'monitoring']);
        const allowedFields = new Set(['temperature', 'humidity', 'light', 'ph', 'ec']);
        for (const equipment of Object.values(gameData.equipment || {})) {
            assert.ok(allowedSlots.has(equipment.slot), `${equipment.id} uses invalid slot ${equipment.slot}`);
            assert.ok(Number(equipment.price) >= 0, `${equipment.id} has invalid price`);
            assert.ok(Number(equipment.tier ?? 0) >= 0, `${equipment.id} has invalid tier`);
            assert.ok(Number(equipment.environmentScoreBonus ?? 0) >= 0, `${equipment.id} has invalid stability bonus`);
            for (const [field, step] of Object.entries(equipment.controlSteps || {})) {
                assert.ok(allowedFields.has(field), `${equipment.id} controls unknown field ${field}`);
                assert.ok(Number(step) > 0, `${equipment.id}.${field} must use a positive control step`);
            }
        }
    });

    it('keeps genetics simulation ranges usable', () => {
        for (const genetics of Object.values(gameData.genetics || {})) {
            for (const field of ['vigor', 'yieldPotential', 'qualityPotential', 'resilience']) {
                assert.ok(Number(genetics[field]) >= 0 && Number(genetics[field]) <= 100, `${genetics.id}.${field} must be 0-100`);
            }
            assert.ok(Number(genetics.floweringDays?.min) > 0, `${genetics.id} needs a positive flowering minimum`);
            assert.ok(Number(genetics.floweringDays?.max) >= Number(genetics.floweringDays?.min), `${genetics.id} flowering range is inverted`);
            assert.ok(Array.isArray(genetics.traits) && genetics.traits.length > 0, `${genetics.id} needs traits`);
        }
    });

    it('keeps the location graph and NPC placement resolvable', () => {
        for (const location of Object.values(gameData.locations || {})) {
            for (const exit of location.exits || []) assert.ok(gameData.locations[exit], `${location.id} exit ${exit} is missing`);
            for (const npc of location.npcs || []) assert.ok(gameData.npcs[npc], `${location.id} NPC ${npc} is missing`);
        }
        for (const npc of Object.values(gameData.npcs || {})) {
            assert.ok(gameData.locations[npc.location], `${npc.id} location ${npc.location} is missing`);
            assert.ok(gameData.locations[npc.location].npcs?.includes(npc.id), `${npc.id} is not listed by location ${npc.location}`);
        }
    });
});
