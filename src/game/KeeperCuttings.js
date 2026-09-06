import { Plant } from './Plant.js';

export function canArchiveKeeperCutting(game, recordId) {
    if (!game?.growJournal || !game?.inventory || !recordId) return { ok: false, reason: 'game_unavailable' };
    const record = game.growJournal.get(recordId);
    if (!record) return { ok: false, reason: 'journal_record_missing' };
    if (!record.keeper) return { ok: false, reason: 'keeper_required' };
    if (!game.gameData?.genetics?.[record.geneticsId]) return { ok: false, reason: 'genetics_missing' };
    return { ok: true, record };
}

export function archiveKeeperCutting(game, recordId) {
    const eligibility = canArchiveKeeperCutting(game, recordId);
    if (!eligibility.ok) return eligibility;
    if (!game.inventory.add('clone', recordId, 1)) return { ok: false, reason: 'inventory_rejected' };
    return {
        ok: true,
        record: eligibility.record,
        count: game.inventory.get('clone', recordId)
    };
}

export function canPlantKeeperCutting(game, recordId) {
    const eligibility = canArchiveKeeperCutting(game, recordId);
    if (!eligibility.ok) return eligibility;
    if (game.location !== 'grow_room') return { ok: false, reason: 'grow_room_required', record: eligibility.record };
    if (game.plant) return { ok: false, reason: 'grow_space_occupied', record: eligibility.record };
    if (!game.inventory.has('clone', recordId)) return { ok: false, reason: 'cutting_required', record: eligibility.record };
    return { ok: true, record: eligibility.record };
}

export function plantKeeperCutting(game, recordId, now = Date.now()) {
    const eligibility = canPlantKeeperCutting(game, recordId);
    if (!eligibility.ok) return eligibility;

    const record = eligibility.record;
    const genetics = game.gameData.genetics[record.geneticsId];
    if (!game.inventory.remove('clone', recordId, 1)) return { ok: false, reason: 'cutting_required', record };

    try {
        game.plant = new Plant(genetics, now, record.phenotypeSeed);
        game.time = now;
        return {
            ok: true,
            record,
            plant: game.plant,
            remaining: game.inventory.get('clone', recordId)
        };
    } catch (error) {
        game.inventory.add('clone', recordId, 1);
        return { ok: false, reason: 'plant_creation_failed', record, error };
    }
}
