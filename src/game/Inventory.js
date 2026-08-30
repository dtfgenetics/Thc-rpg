export class Inventory {
    constructor() {
        this.seed = {};
        this.item = {};
        this.harvest = {};
    }

    static validCount(count) {
        return Number.isFinite(count) && count > 0;
    }

    add(cat, id, count = 1) {
        if (!this[cat] || !id || !Inventory.validCount(count)) return false;
        this[cat][id] = (this[cat][id] || 0) + count;
        return true;
    }

    remove(cat, id, count = 1) {
        if (!this[cat] || !id || !Inventory.validCount(count)) return false;
        const current = this[cat][id] || 0;
        if (current < count) return false;
        const next = current - count;
        if (next <= 0) delete this[cat][id];
        else this[cat][id] = next;
        return true;
    }

    has(cat, id, count = 1) {
        if (!this[cat] || !id || !Inventory.validCount(count)) return false;
        return (this[cat][id] || 0) >= count;
    }

    get(cat, id) {
        if (!this[cat] || !id) return 0;
        return this[cat][id] || 0;
    }

    getAll(cat) {
        if (!this[cat]) return {};
        return { ...this[cat] };
    }

    save() {
        return {
            seed: { ...this.seed },
            item: { ...this.item },
            harvest: { ...this.harvest }
        };
    }

    load(data = {}) {
        this.seed = { ...(data.seed || {}) };
        this.item = { ...(data.item || {}) };
        this.harvest = { ...(data.harvest || {}) };
    }
}
