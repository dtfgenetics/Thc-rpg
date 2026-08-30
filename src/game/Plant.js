const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const MAX_TICK_SECONDS = 30;

export class Plant {
    constructor(genetics, now = Date.now()) {
        if (!genetics?.id) throw new Error('Plant requires valid genetics');

        this.genetics = genetics;
        this.geneticsId = genetics.id;
        this.name = genetics.name || 'Unknown';
        this.stage = 'seed';
        this.age = 0;
        this.health = 100;
        this.vigor = clamp(genetics.vigor ?? 75);
        this.stress = 0;
        this.hydration = 80;
        this.development = 0;
        this.startTime = now;
        this.lastUpdate = now;
    }

    update(now = Date.now()) {
        const elapsedSeconds = clamp((now - this.lastUpdate) / 1000, 0, MAX_TICK_SECONDS);
        this.lastUpdate = now;
        this.age = Math.max(0, (now - this.startTime) / 60000);

        if (elapsedSeconds <= 0 || this.stage === 'harvest_ready') {
            this.updateStage();
            return;
        }

        this.hydration = clamp(this.hydration - (0.08 * elapsedSeconds));

        if (this.hydration < 30) {
            this.stress = clamp(this.stress + (0.22 * elapsedSeconds));
        } else if (this.hydration > 92) {
            this.stress = clamp(this.stress + (0.10 * elapsedSeconds));
        } else {
            this.stress = clamp(this.stress - (0.08 * elapsedSeconds));
        }

        if (this.hydration < 18 || this.stress > 65) {
            this.health = clamp(this.health - (0.12 * elapsedSeconds));
        } else if (this.hydration >= 45 && this.hydration <= 85 && this.stress < 25) {
            this.health = clamp(this.health + (0.025 * elapsedSeconds));
        }

        const hydrationFactor = this.hydration < 25 ? 0.35 : this.hydration > 95 ? 0.65 : 1;
        const stressFactor = Math.max(0.25, 1 - (this.stress / 125));
        const rate = 0.18 * (this.health / 100) * (this.vigor / 100) * hydrationFactor * stressFactor;
        this.development = clamp(this.development + (rate * elapsedSeconds));

        this.updateStage();
    }

    updateStage() {
        if (this.development < 5) this.stage = 'seed';
        else if (this.development < 20) this.stage = 'seedling';
        else if (this.development < 50) this.stage = 'vegetative';
        else if (this.development < 80) this.stage = 'flowering';
        else this.stage = 'harvest_ready';
    }

    water(amount = 15) {
        if (!Number.isFinite(amount) || amount <= 0) return false;
        this.hydration = clamp(this.hydration + amount);
        if (this.hydration > 92) this.stress = clamp(this.stress + 2);
        return true;
    }

    calculateYield() {
        const potential = clamp(this.genetics.yieldPotential ?? 50);
        const stressFactor = Math.max(0.35, 1 - (this.stress / 140));
        const grams = (5 + potential * 0.24) * (this.health / 100) * (this.vigor / 100) * stressFactor;
        return Math.max(1, Math.round(grams));
    }

    calculateQuality() {
        const potential = clamp(this.genetics.qualityPotential ?? 50);
        const stressFactor = Math.max(0.4, 1 - (this.stress / 130));
        return clamp(Math.round(potential * (this.health / 100) * stressFactor), 1, 100);
    }

    save() {
        return {
            geneticsId: this.geneticsId,
            stage: this.stage,
            age: this.age,
            health: this.health,
            vigor: this.vigor,
            stress: this.stress,
            hydration: this.hydration,
            development: this.development,
            startTime: this.startTime,
            lastUpdate: this.lastUpdate
        };
    }

    static load(data, genetics) {
        const sourceGenetics = genetics || data?.genetics;
        if (!sourceGenetics?.id) throw new Error('Cannot load plant without genetics');

        const now = Date.now();
        const p = new Plant(sourceGenetics, data.startTime ?? now);
        p.stage = data.stage ?? 'seed';
        p.age = data.age ?? 0;
        p.health = data.health ?? 100;
        p.vigor = data.vigor ?? (sourceGenetics.vigor ?? 75);
        p.stress = data.stress ?? 0;
        p.hydration = data.hydration ?? 80;
        p.development = data.development ?? 0;
        p.startTime = data.startTime ?? now;
        p.lastUpdate = data.lastUpdate ?? now;
        p.updateStage();
        return p;
    }
}
