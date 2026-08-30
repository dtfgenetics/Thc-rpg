const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const asInteger = value => Math.round(Number(value));

export function seedFromString(input) {
    let hash = 0x811c9dc5;
    for (const char of String(input)) {
        hash ^= char.codePointAt(0);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
}

export function createPhenotypeSeed() {
    try {
        if (globalThis.crypto?.getRandomValues) {
            const value = new Uint32Array(1);
            globalThis.crypto.getRandomValues(value);
            return value[0] >>> 0;
        }
    } catch {
        // Fall through to Math.random for older/non-browser runtimes.
    }
    return Math.floor(Math.random() * 0x100000000) >>> 0;
}

function normalizeSeed(seed) {
    if (Number.isFinite(seed)) return Number(seed) >>> 0;
    return seedFromString(seed ?? 'thc-rpg');
}

function seededRandom(seed) {
    let state = normalizeSeed(seed);
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function getFloweringRange(genetics) {
    const source = genetics?.floweringDays || {};
    const min = Math.max(1, asInteger(source.min ?? source.max ?? 63));
    const max = Math.max(min, asInteger(source.max ?? source.min ?? 63));
    return { min, max };
}

function getTraitList(genetics) {
    return Array.isArray(genetics?.traits)
        ? genetics.traits.filter(trait => typeof trait === 'string' && trait.trim())
        : [];
}

function normalizeTraits(traits, genetics, count = 3) {
    const allowed = new Set(getTraitList(genetics));
    const source = Array.isArray(traits) ? traits : [];
    const normalized = [...new Set(source.filter(trait => allowed.has(trait)))];
    if (normalized.length) return normalized.slice(0, Math.max(1, count));
    return getTraitList(genetics).slice(0, Math.max(1, count));
}

function varyStat(base, spread, random) {
    const safeBase = clamp(asInteger(base));
    const safeSpread = Math.max(0, asInteger(spread));
    return clamp(Math.round(safeBase + ((random() * 2 - 1) * safeSpread)));
}

export function createBaselinePhenotype(genetics, overrides = {}) {
    if (!genetics?.id) throw new Error('Phenotype requires valid genetics');

    const { min, max } = getFloweringRange(genetics);
    const traitCount = Math.max(1, asInteger(genetics.phenotypeVariation?.traitCount ?? 3));
    const seed = normalizeSeed(overrides.seed ?? seedFromString(`${genetics.id}:baseline`));

    return {
        seed,
        vigor: clamp(asInteger(overrides.vigor ?? genetics.vigor ?? 75)),
        yieldPotential: clamp(asInteger(overrides.yieldPotential ?? genetics.yieldPotential ?? 50)),
        qualityPotential: clamp(asInteger(overrides.qualityPotential ?? genetics.qualityPotential ?? 50)),
        resilience: clamp(asInteger(overrides.resilience ?? genetics.resilience ?? 50)),
        floweringDays: clamp(asInteger(overrides.floweringDays ?? ((min + max) / 2)), min, max),
        dominantTraits: normalizeTraits(overrides.dominantTraits, genetics, traitCount)
    };
}

export function generatePhenotype(genetics, seed = createPhenotypeSeed()) {
    if (!genetics?.id) throw new Error('Phenotype requires valid genetics');

    const resolvedSeed = normalizeSeed(seed);
    const random = seededRandom(resolvedSeed);
    const variation = genetics.phenotypeVariation || {};
    const { min, max } = getFloweringRange(genetics);
    const traits = getTraitList(genetics);
    const traitCount = Math.min(
        traits.length,
        Math.max(1, asInteger(variation.traitCount ?? Math.min(3, traits.length || 1)))
    );

    for (let index = traits.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [traits[index], traits[swapIndex]] = [traits[swapIndex], traits[index]];
    }

    return {
        seed: resolvedSeed,
        vigor: varyStat(genetics.vigor ?? 75, variation.vigor ?? 5, random),
        yieldPotential: varyStat(genetics.yieldPotential ?? 50, variation.yieldPotential ?? 8, random),
        qualityPotential: varyStat(genetics.qualityPotential ?? 50, variation.qualityPotential ?? 5, random),
        resilience: varyStat(genetics.resilience ?? 50, variation.resilience ?? 6, random),
        floweringDays: min === max ? min : min + Math.floor(random() * (max - min + 1)),
        dominantTraits: traits.slice(0, traitCount)
    };
}

export function normalizeSavedPhenotype(genetics, phenotype = {}) {
    const baseline = createBaselinePhenotype(genetics, { seed: phenotype.seed });
    const { min, max } = getFloweringRange(genetics);
    const traitCount = Math.max(1, asInteger(genetics.phenotypeVariation?.traitCount ?? 3));

    return {
        seed: normalizeSeed(phenotype.seed ?? baseline.seed),
        vigor: clamp(asInteger(Number.isFinite(phenotype.vigor) ? phenotype.vigor : baseline.vigor)),
        yieldPotential: clamp(asInteger(Number.isFinite(phenotype.yieldPotential) ? phenotype.yieldPotential : baseline.yieldPotential)),
        qualityPotential: clamp(asInteger(Number.isFinite(phenotype.qualityPotential) ? phenotype.qualityPotential : baseline.qualityPotential)),
        resilience: clamp(asInteger(Number.isFinite(phenotype.resilience) ? phenotype.resilience : baseline.resilience)),
        floweringDays: clamp(asInteger(Number.isFinite(phenotype.floweringDays) ? phenotype.floweringDays : baseline.floweringDays), min, max),
        dominantTraits: normalizeTraits(phenotype.dominantTraits, genetics, traitCount)
    };
}
