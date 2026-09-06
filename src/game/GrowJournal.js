const MAX_RECORDS = 50;

const clone = value => JSON.parse(JSON.stringify(value));
const finiteOr = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, finiteOr(value, min)));

function normalizeTraits(traits) {
    if (!Array.isArray(traits)) return [];
    return [...new Set(traits.filter(trait => typeof trait === 'string' && trait.trim()).map(trait => trait.trim()))].slice(0, 12);
}

function normalizeRecord(record) {
    if (!record || typeof record !== 'object' || !record.id || !record.geneticsId) return null;
    return {
        id: String(record.id),
        geneticsId: String(record.geneticsId),
        plantName: String(record.plantName || record.geneticsId),
        phenotypeSeed: Math.max(0, Math.floor(finiteOr(record.phenotypeSeed, 0))),
        dominantTraits: normalizeTraits(record.dominantTraits),
        vigor: clamp(record.vigor),
        yieldPotential: clamp(record.yieldPotential),
        qualityPotential: clamp(record.qualityPotential),
        resilience: clamp(record.resilience),
        floweringDays: Math.max(1, Math.round(finiteOr(record.floweringDays, 63))),
        finalHealth: clamp(record.finalHealth),
        finalStress: clamp(record.finalStress),
        finalEnvironmentScore: clamp(record.finalEnvironmentScore),
        yield: Math.max(0, Math.round(finiteOr(record.yield, 0))),
        quality: clamp(record.quality, 1, 100),
        keeper: Boolean(record.keeper),
        harvestedAt: Math.max(0, Math.floor(finiteOr(record.harvestedAt, 0)))
    };
}

export class GrowJournal {
    constructor(records = []) {
        this.records = [];
        this.load(records);
    }

    record({ plant, yieldAmount, quality, harvestedAt = Date.now() }) {
        if (!plant?.geneticsId || !plant?.phenotype) return null;
        const timestamp = Math.max(0, Math.floor(finiteOr(harvestedAt, Date.now())));
        const entry = normalizeRecord({
            id: `${plant.geneticsId}:${plant.phenotype.seed}:${timestamp}`,
            geneticsId: plant.geneticsId,
            plantName: plant.name,
            phenotypeSeed: plant.phenotype.seed,
            dominantTraits: plant.dominantTraits,
            vigor: plant.vigor,
            yieldPotential: plant.yieldPotential,
            qualityPotential: plant.qualityPotential,
            resilience: plant.resilience,
            floweringDays: plant.floweringDays,
            finalHealth: plant.health,
            finalStress: plant.stress,
            finalEnvironmentScore: plant.environmentScore,
            yield: yieldAmount,
            quality,
            keeper: false,
            harvestedAt: timestamp
        });
        if (!entry) return null;
        this.records = [entry, ...this.records.filter(record => record.id !== entry.id)].slice(0, MAX_RECORDS);
        return clone(entry);
    }

    getAll() {
        return clone(this.records);
    }

    get(id) {
        const record = this.records.find(entry => entry.id === id);
        return record ? clone(record) : null;
    }

    toggleKeeper(id, value = undefined) {
        const record = this.records.find(entry => entry.id === id);
        if (!record) return false;
        record.keeper = value === undefined ? !record.keeper : Boolean(value);
        return true;
    }

    save() {
        return this.getAll();
    }

    load(records = []) {
        const normalized = Array.isArray(records)
            ? records.map(normalizeRecord).filter(Boolean).slice(0, MAX_RECORDS)
            : [];
        const seen = new Set();
        this.records = normalized.filter(record => {
            if (seen.has(record.id)) return false;
            seen.add(record.id);
            return true;
        });
        return this;
    }
}
