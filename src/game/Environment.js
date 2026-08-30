const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const FIELD_LIMITS = {
    temperature: { min: 40, max: 110 },
    humidity: { min: 10, max: 100 },
    light: { min: 0, max: 100 },
    ph: { min: 3, max: 9 },
    ec: { min: 0, max: 4 }
};

const STAGE_TARGETS = {
    seed: { temperature: 74, humidity: 68, light: 30, ph: 6.2, ec: 0.5, vpd: 0.7 },
    seedling: { temperature: 75, humidity: 65, light: 45, ph: 6.2, ec: 0.7, vpd: 0.8 },
    vegetative: { temperature: 76, humidity: 60, light: 70, ph: 6.2, ec: 1.1, vpd: 1.0 },
    flowering: { temperature: 75, humidity: 52, light: 85, ph: 6.3, ec: 1.4, vpd: 1.2 },
    harvest_ready: { temperature: 74, humidity: 50, light: 70, ph: 6.3, ec: 1.1, vpd: 1.2 }
};

const TOLERANCE = {
    temperature: 14,
    humidity: 30,
    light: 45,
    ph: 1.4,
    ec: 1.1,
    vpd: 0.9
};

function scoreDistance(value, target, tolerance) {
    if (!Number.isFinite(value) || !Number.isFinite(target)) return 0;
    return clamp(100 - ((Math.abs(value - target) / tolerance) * 100), 0, 100);
}

function targetForStage(stage) {
    return STAGE_TARGETS[stage] || STAGE_TARGETS.vegetative;
}

export class Environment {
    constructor(data = {}) {
        this.temperature = 75;
        this.humidity = 60;
        this.light = 65;
        this.ph = 6.2;
        this.ec = 1.0;
        this.load(data);
    }

    set(field, value) {
        const limits = FIELD_LIMITS[field];
        if (!limits || !Number.isFinite(Number(value))) return false;
        this[field] = clamp(Number(value), limits.min, limits.max);
        return true;
    }

    adjust(field, delta) {
        if (!Number.isFinite(Number(delta)) || !FIELD_LIMITS[field]) return false;
        return this.set(field, this[field] + Number(delta));
    }

    getVpd() {
        const celsius = (this.temperature - 32) * (5 / 9);
        const saturationKpa = 0.6108 * Math.exp((17.27 * celsius) / (celsius + 237.3));
        return Math.max(0, saturationKpa * (1 - (this.humidity / 100)));
    }

    evaluate(stage) {
        const target = targetForStage(stage);
        const vpd = this.getVpd();
        const scores = {
            temperature: scoreDistance(this.temperature, target.temperature, TOLERANCE.temperature),
            humidity: scoreDistance(this.humidity, target.humidity, TOLERANCE.humidity),
            light: scoreDistance(this.light, target.light, TOLERANCE.light),
            ph: scoreDistance(this.ph, target.ph, TOLERANCE.ph),
            ec: scoreDistance(this.ec, target.ec, TOLERANCE.ec),
            vpd: scoreDistance(vpd, target.vpd, TOLERANCE.vpd)
        };

        const airScore = (scores.temperature + scores.humidity + scores.vpd) / 3;
        const overall = clamp(
            (airScore * 0.35) +
            (scores.light * 0.25) +
            (scores.ph * 0.20) +
            (scores.ec * 0.20),
            0,
            100
        );

        const stressRate = overall >= 75 ? 0 : ((75 - overall) / 75) * 0.18;
        const healthDamageRate = overall >= 35 ? 0 : ((35 - overall) / 35) * 0.08;
        const growthModifier = clamp(0.5 + (overall / 200), 0.5, 1.0);

        return {
            stage,
            score: overall,
            status: overall >= 75 ? 'good' : overall >= 45 ? 'warning' : 'danger',
            vpd,
            scores,
            stressRate,
            healthDamageRate,
            growthModifier
        };
    }

    save() {
        return {
            temperature: this.temperature,
            humidity: this.humidity,
            light: this.light,
            ph: this.ph,
            ec: this.ec
        };
    }

    load(data = {}) {
        for (const field of Object.keys(FIELD_LIMITS)) {
            if (data[field] != null) this.set(field, Number(data[field]));
        }
        return this;
    }
}
