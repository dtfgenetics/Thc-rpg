const DEFAULT_CONTROL_STEPS = Object.freeze({
    temperature: 5,
    humidity: 10,
    light: 10,
    ph: 0.5,
    ec: 0.5
});

const clone = value => JSON.parse(JSON.stringify(value));

export class Equipment {
    constructor(definitions = {}) {
        this.definitions = definitions || {};
        this.owned = new Set();
        this.equipped = {};
        this.grantStarterEquipment();
    }

    grantStarterEquipment() {
        for (const definition of Object.values(this.definitions)) {
            if (definition?.starter === true) this.grant(definition.id, true);
        }
    }

    has(id) {
        return this.owned.has(id);
    }

    get(id) {
        return this.definitions[id] || null;
    }

    grant(id, autoEquip = false) {
        const definition = this.get(id);
        if (!definition?.id || !definition.slot) return false;
        this.owned.add(id);
        if (autoEquip) this.equip(id);
        return true;
    }

    equip(id) {
        const definition = this.get(id);
        if (!definition?.slot || !this.has(id)) return false;
        this.equipped[definition.slot] = id;
        return true;
    }

    getEquipped(slot) {
        const id = this.equipped[slot];
        return id ? this.get(id) : null;
    }

    getOwnedDefinitions() {
        return [...this.owned]
            .map(id => this.get(id))
            .filter(Boolean)
            .map(definition => clone(definition));
    }

    getEquippedDefinitions() {
        const result = {};
        for (const [slot, id] of Object.entries(this.equipped)) {
            const definition = this.get(id);
            if (definition) result[slot] = clone(definition);
        }
        return result;
    }

    getControlStep(field) {
        let step = DEFAULT_CONTROL_STEPS[field];
        if (!Number.isFinite(step)) return null;

        for (const id of Object.values(this.equipped)) {
            const candidate = Number(this.get(id)?.controlSteps?.[field]);
            if (Number.isFinite(candidate) && candidate > 0) step = Math.min(step, candidate);
        }
        return step;
    }

    save() {
        return {
            owned: [...this.owned],
            equipped: { ...this.equipped }
        };
    }

    load(data = {}) {
        this.owned = new Set();
        this.equipped = {};
        this.grantStarterEquipment();

        for (const id of data.owned || []) {
            this.grant(id, false);
        }

        for (const [slot, id] of Object.entries(data.equipped || {})) {
            const definition = this.get(id);
            if (!definition || definition.slot !== slot || !this.has(id)) continue;
            this.equipped[slot] = id;
        }

        for (const definition of Object.values(this.definitions)) {
            if (definition?.starter !== true || !definition.slot) continue;
            if (!this.equipped[definition.slot]) this.equip(definition.id);
        }

        return this;
    }
}

export { DEFAULT_CONTROL_STEPS };
