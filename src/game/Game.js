import { Plant } from './Plant.js';
import { Inventory } from './Inventory.js';
import { Environment } from './Environment.js';
import { Equipment } from './Equipment.js';

const objectiveKey = (objective, index) => objective.id || `${objective.type}:${objective.target || 'any'}:${index}`;
const clone = value => JSON.parse(JSON.stringify(value));

export class Game {
    constructor(name, gameData) {
        if (!gameData?.genetics || !gameData?.locations) {
            throw new Error('Game requires valid game data');
        }

        this.gameData = gameData;
        this.player = {
            name: name || 'Green Thumb',
            level: 1,
            xp: 0,
            xpToNext: 100,
            money: 100,
            reputation: 0
        };
        this.inventory = new Inventory();
        this.environment = new Environment();
        this.equipment = new Equipment(this.gameData.equipment || {});
        this.plant = null;
        this.quests = { active: [], completed: [], progress: {} };
        this.location = 'grow_room';
        this.time = 0;
        this.saveVersion = 5;

        this.inventory.add('item', 'basic_soil', 1);
        this.inventory.add('item', 'small_pot', 1);
    }

    moveTo(loc) {
        if (!this.gameData.locations[loc]) return false;
        const current = this.gameData.locations[this.location];
        if (current?.exits?.length && !current.exits.includes(loc)) return false;
        this.location = loc;
        return true;
    }

    setEnvironment(field, value) {
        return this.environment.set(field, value);
    }

    adjustEnvironment(field, delta) {
        return this.environment.adjust(field, delta);
    }

    getEnvironmentControlStep(field) {
        return this.equipment.getControlStep(field);
    }

    nudgeEnvironment(field, direction) {
        if (direction !== -1 && direction !== 1) return false;
        const step = this.getEnvironmentControlStep(field);
        if (!Number.isFinite(step)) return false;
        const current = Number(this.environment[field]);
        if (!Number.isFinite(current)) return false;
        return this.setEnvironment(field, Number((current + (step * direction)).toFixed(2)));
    }

    getEnvironmentStatus() {
        return this.environment.evaluate(this.plant?.stage || 'vegetative');
    }

    getEquipmentCatalog() {
        return Object.values(this.gameData.equipment || {}).map(definition => ({
            ...clone(definition),
            owned: this.equipment.has(definition.id),
            equipped: this.equipment.equipped[definition.slot] === definition.id
        }));
    }

    purchaseEquipment(id) {
        const definition = this.equipment.get(id);
        if (!definition || this.equipment.has(id)) return false;
        const price = Number(definition.price);
        if (!Number.isFinite(price) || price < 0 || this.player.money < price) return false;
        if (!this.equipment.grant(id, true)) return false;
        this.player.money -= price;
        this.recordObjective('purchase_equipment', id);
        return true;
    }

    equipEquipment(id) {
        return this.equipment.equip(id);
    }

    plantSeed(id, phenotypeSeed = undefined) {
        if (this.plant) return false;

        const genetics = this.gameData.genetics[id];
        if (!genetics) return false;
        if (!this.inventory.has('seed', id)) return false;
        if (!this.inventory.remove('seed', id)) return false;

        this.plant = new Plant(genetics, Date.now(), phenotypeSeed);
        this.recordObjective('plant_seed', id);
        return true;
    }

    harvest() {
        if (!this.plant || this.plant.stage !== 'harvest_ready') return null;

        const geneticsId = this.plant.geneticsId;
        const yieldAmt = this.plant.calculateYield();
        const quality = this.plant.calculateQuality();
        const xpGain = 50 + Math.floor(yieldAmt * 0.5);
        const moneyGain = Math.floor(yieldAmt * 10);

        this.recordObjective('reach_growth_stage', 'harvest_ready');
        this.recordObjective('harvest_plant', geneticsId);
        this.inventory.add('harvest', `${geneticsId}_harvest`, yieldAmt);
        this.player.money += moneyGain;
        this.addXP(xpGain);

        const result = {
            geneticsId,
            yield: yieldAmt,
            quality,
            xp: xpGain,
            money: moneyGain
        };

        this.plant = null;
        return result;
    }

    addXP(amount) {
        if (!Number.isFinite(amount) || amount <= 0) return false;
        this.player.xp += amount;

        while (this.player.xp >= this.player.xpToNext) {
            this.player.xp -= this.player.xpToNext;
            this.player.level += 1;
            this.player.xpToNext = Math.floor(this.player.xpToNext * 1.5);
        }
        return true;
    }

    areQuestPrerequisitesMet(id) {
        const quest = this.gameData.quests?.[id];
        if (!quest) return false;
        return (quest.prerequisites || []).every(prerequisite => this.quests.completed.includes(prerequisite));
    }

    getAvailableQuests() {
        return Object.values(this.gameData.quests || {})
            .filter(quest => !this.quests.active.includes(quest.id))
            .filter(quest => !this.quests.completed.includes(quest.id))
            .filter(quest => this.areQuestPrerequisitesMet(quest.id))
            .map(quest => clone(quest));
    }

    startQuest(id = 'first_seed') {
        const quest = this.gameData.quests?.[id];
        if (!quest || this.quests.completed.includes(id) || this.quests.active.includes(id)) return false;
        if (!this.areQuestPrerequisitesMet(id)) return false;

        this.quests.active.push(id);
        this.quests.progress[id] = {};
        (quest.objectives || []).forEach((objective, index) => {
            this.quests.progress[id][objectiveKey(objective, index)] = 0;
        });

        this.syncQuestProgress(id);
        return true;
    }

    syncQuestProgress(id) {
        if (!this.quests.active.includes(id)) return false;
        const quest = this.gameData.quests?.[id];
        if (!quest) return false;
        let changed = false;

        if (this.plant) {
            changed = this.recordObjective('plant_seed', this.plant.geneticsId) || changed;
            if (this.plant.stage === 'harvest_ready') {
                changed = this.recordObjective('reach_growth_stage', 'harvest_ready') || changed;
            }
        }

        const upgraded = this.equipment.getOwnedDefinitions().find(item => item.starter !== true);
        if (upgraded) changed = this.recordObjective('purchase_equipment', upgraded.id) || changed;

        return changed;
    }

    recordObjective(type, target = null, amount = 1) {
        if (!Number.isFinite(amount) || amount <= 0) return false;
        let changed = false;

        for (const questId of this.quests.active) {
            const quest = this.gameData.quests?.[questId];
            if (!quest) continue;

            (quest.objectives || []).forEach((objective, index) => {
                if (objective.type !== type) return;
                if (objective.target && objective.target !== target) return;

                const key = objectiveKey(objective, index);
                const required = objective.required ?? 1;
                const current = this.quests.progress[questId]?.[key] ?? 0;
                const next = Math.min(required, current + amount);
                if (next !== current) {
                    this.quests.progress[questId][key] = next;
                    changed = true;
                }
            });
        }
        return changed;
    }

    getQuestProgress(id = 'first_seed') {
        const quest = this.gameData.quests?.[id];
        if (!quest) return null;
        const progress = this.quests.progress[id] || {};
        const objectives = (quest.objectives || []).map((objective, index) => {
            const key = objectiveKey(objective, index);
            const required = objective.required ?? 1;
            const current = progress[key] ?? 0;
            return { ...objective, current, required, completed: current >= required };
        });
        return {
            id,
            title: quest.title,
            icon: quest.icon,
            description: quest.description,
            prerequisites: [...(quest.prerequisites || [])],
            nextQuest: quest.nextQuest || null,
            active: this.quests.active.includes(id),
            completed: this.quests.completed.includes(id),
            objectives
        };
    }

    getActiveQuestStates() {
        return this.quests.active
            .map(id => this.getQuestProgress(id))
            .filter(Boolean);
    }

    isQuestReady(id = 'first_seed') {
        const state = this.getQuestProgress(id);
        return Boolean(state?.active && state.objectives.every(objective => objective.completed));
    }

    completeQuest(id = 'first_seed') {
        if (!this.isQuestReady(id)) return false;

        const quest = this.gameData.quests[id];
        const idx = this.quests.active.indexOf(id);
        this.quests.active.splice(idx, 1);
        if (!this.quests.completed.includes(id)) this.quests.completed.push(id);

        const rewards = quest.rewards || {};
        this.addXP(rewards.xp ?? 0);
        this.player.money += rewards.money ?? 0;

        const rewardItems = rewards.items || {};
        for (const [category, entries] of Object.entries(rewardItems)) {
            const normalizedCategory = category === 'seeds' ? 'seed' : category;
            for (const [itemId, count] of Object.entries(entries || {})) {
                this.inventory.add(normalizedCategory, itemId, count);
            }
        }

        return true;
    }

    completeReadyQuests() {
        const completed = [];
        for (const questId of [...this.quests.active]) {
            if (this.completeQuest(questId)) completed.push(questId);
        }
        return completed;
    }

    update(now = Date.now()) {
        this.time = now;
        if (!this.plant) return;

        const wasReady = this.plant.stage === 'harvest_ready';
        const environment = this.environment.evaluate(this.plant.stage);
        this.recordObjective('maintain_environment_status', environment.status);
        this.plant.update(now, environment);
        if (!wasReady && this.plant.stage === 'harvest_ready') {
            this.recordObjective('reach_growth_stage', 'harvest_ready');
        }
    }

    save() {
        return {
            version: this.saveVersion,
            player: { ...this.player },
            inventory: this.inventory.save(),
            environment: this.environment.save(),
            equipment: this.equipment.save(),
            plant: this.plant ? this.plant.save() : null,
            quests: {
                active: [...this.quests.active],
                completed: [...this.quests.completed],
                progress: clone(this.quests.progress)
            },
            location: this.location,
            time: this.time
        };
    }

    load(data) {
        if (![1, 2, 3, 4, 5].includes(data?.version)) throw new Error('Unsupported save version');

        const defaults = this.player;
        this.player = { ...defaults, ...(data.player || {}) };

        if (data.version === 1 && Number.isFinite(data.inventory?.money)) {
            this.player.money = Math.max(this.player.money ?? 0, data.inventory.money);
        }

        this.inventory.load(data.inventory || {});
        this.environment = new Environment(data.environment || {});
        this.equipment = new Equipment(this.gameData.equipment || {});
        this.equipment.load(data.equipment || {});

        if (data.plant) {
            const geneticsId = data.plant.geneticsId || data.plant.genetics?.id;
            const genetics = this.gameData.genetics[geneticsId] || data.plant.genetics;
            this.plant = Plant.load(data.plant, genetics);
        } else {
            this.plant = null;
        }

        const loadedQuests = data.quests || {};
        this.quests = {
            active: [...new Set(loadedQuests.active || [])].filter(id => this.gameData.quests?.[id]),
            completed: [...new Set(loadedQuests.completed || [])].filter(id => this.gameData.quests?.[id]),
            progress: clone(loadedQuests.progress || {})
        };
        this.quests.active = this.quests.active.filter(id => !this.quests.completed.includes(id));

        for (const questId of this.quests.active) {
            if (!this.quests.progress[questId]) this.quests.progress[questId] = {};
            (this.gameData.quests?.[questId]?.objectives || []).forEach((objective, index) => {
                const key = objectiveKey(objective, index);
                if (this.quests.progress[questId][key] == null) this.quests.progress[questId][key] = 0;
            });
            this.syncQuestProgress(questId);
        }

        this.location = this.gameData.locations[data.location] ? data.location : 'grow_room';
        this.time = data.time ?? 0;
    }
}
