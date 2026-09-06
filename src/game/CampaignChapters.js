const clone = value => JSON.parse(JSON.stringify(value));

export const CAMPAIGN_EXPANSION_VERSION = '2.1.0';

export const ZESTBERRY_GENETICS = {
    id: 'zestberry',
    name: 'Zestberry',
    breeder: 'DTF Genetics',
    lineage: { mother: 'Blue Mango', father: 'Cali Orange' },
    description: 'An advanced DTF Genetics selection line used as the first post-Keeper campaign unlock in THC RPG, emphasizing bright citrus, berry character, branching, and resin potential.',
    type: 'hybrid',
    vigor: 84,
    floweringDays: { min: 56, max: 70 },
    yieldPotential: 81,
    qualityPotential: 91,
    resilience: 78,
    difficulty: 'advanced',
    traits: ['citrus', 'berry', 'resinous', 'branching', 'bright_aroma'],
    phenotypeVariation: { vigor: 7, yieldPotential: 9, qualityPotential: 7, resilience: 7, traitCount: 4 },
    stageEmojis: { seed: '🌰', seedling: '🌱', vegetative: '🌿', flowering: '🌸', harvest_ready: '💐' }
};

export const KEEPER_CAMPAIGN_QUESTS = {
    keeper_standard: {
        id: 'keeper_standard',
        title: 'Keeper Standard',
        icon: '⭐',
        description: 'Turn phenotype selection into preserved stock. Choose a Mango Bubbles Keeper and bank a cutting from that exact phenotype.',
        prerequisites: ['phenotype_hunt'],
        objectives: [
            { id: 'select_mango_keeper', type: 'select_keeper', target: 'mango_bubbles', required: 1, description: 'Mark a Mango Bubbles harvest as a Keeper' },
            { id: 'archive_mango_cutting', type: 'archive_keeper_cutting', target: 'mango_bubbles', required: 1, description: 'Propagate one cutting from the selected Keeper stock' }
        ],
        rewards: { xp: 300, money: 250, items: { item: { nutrients: 2 } } },
        nextQuest: 'clone_proof'
    },
    clone_proof: {
        id: 'clone_proof',
        title: 'Clone Proof',
        icon: '🌿',
        description: 'Prove that preserved Keeper stock has gameplay value by replanting the exact phenotype and carrying it through another high-quality run.',
        prerequisites: ['keeper_standard'],
        objectives: [
            { id: 'plant_keeper_clone', type: 'plant_keeper_cutting', target: 'mango_bubbles', required: 1, description: 'Plant a Mango Bubbles Keeper cutting' },
            { id: 'clone_room_control', type: 'maintain_environment_status', target: 'good', required: 6, description: 'Hold a good room score for 6 simulation checks during the clone chapter' },
            { id: 'clone_quality_proof', type: 'harvest_quality', target: 'mango_bubbles', required: 82, description: 'Harvest Mango Bubbles at 82+ quality after proving the Keeper cutting loop' }
        ],
        rewards: { xp: 350, money: 300, items: { seed: { zestberry: 3 }, item: { nutrients: 3 } } },
        nextQuest: 'zestberry_trial'
    },
    zestberry_trial: {
        id: 'zestberry_trial',
        title: 'Zestberry Trial',
        icon: '🍊',
        description: 'Use the advanced room and the genetics unlocked by Keeper work to complete the first post-selection trial line.',
        prerequisites: ['clone_proof'],
        objectives: [
            { id: 'plant_zestberry', type: 'plant_seed', target: 'zestberry', required: 1, description: 'Plant a Zestberry seed earned from Clone Proof' },
            { id: 'full_advanced_room', type: 'advanced_equipment_owned', required: 3, description: 'Own all 3 advanced-tier equipment upgrades' },
            { id: 'zestberry_room_control', type: 'maintain_environment_status', target: 'good', required: 8, description: 'Hold a good room score for 8 simulation checks' },
            { id: 'zestberry_quality', type: 'harvest_quality', target: 'zestberry', required: 84, description: 'Harvest Zestberry at 84+ quality' }
        ],
        rewards: { xp: 500, money: 500, items: { seed: { zestberry: 2 }, item: { nutrients: 5 } } },
        nextQuest: null
    }
};

export function applyCampaignExpansion(baseData) {
    if (!baseData?.genetics || !baseData?.quests) throw new Error('Campaign expansion requires genetics and quests');
    const data = clone(baseData);
    data.genetics.zestberry = clone(ZESTBERRY_GENETICS);
    for (const [id, quest] of Object.entries(KEEPER_CAMPAIGN_QUESTS)) data.quests[id] = clone(quest);
    if (data.quests.phenotype_hunt) data.quests.phenotype_hunt.nextQuest = 'keeper_standard';
    data.schemaVersion = Math.max(Number(data.schemaVersion || 0), 7);
    return data;
}
