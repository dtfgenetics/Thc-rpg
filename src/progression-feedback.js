import { Game } from './game/Game.js';

const scene = document.getElementById('sceneContent');
let scheduled = false;

function findCardByHeading(text) {
    if (!scene) return null;
    return [...scene.querySelectorAll('.environment-card')].find(card => {
        const heading = card.querySelector('.environment-header strong');
        return heading?.textContent?.includes(text);
    }) || null;
}

function enhanceRoomCard(game) {
    const card = findCardByHeading('Grow Room');
    if (!card || card.dataset.progressionEnhanced === 'true') return;

    const status = game.getEnvironmentStatus();
    const readout = card.querySelector('.vpd-readout');
    if (readout && status.equipmentBonus > 0) {
        readout.textContent += ` • Base ${Math.round(status.baseScore)}% + gear ${status.equipmentBonus.toFixed(0)}`;
    }

    const scoreLabel = card.querySelector('.environment-score span');
    if (scoreLabel && status.equipmentBonus > 0) {
        scoreLabel.textContent = `${scoreLabel.textContent} • +${status.equipmentBonus.toFixed(0)} gear`;
    }
    card.dataset.progressionEnhanced = 'true';
}

function enhanceQuestTracker(game) {
    const state = game.getActiveQuestStates()[0];
    if (!state) return;
    const card = findCardByHeading(state.title);
    if (!card || card.dataset.progressionEnhanced === 'true') return;

    const rows = [...card.querySelectorAll('.environment-row')];
    for (const objective of state.objectives) {
        const row = rows.find(candidate => candidate.querySelector('.environment-label strong')?.textContent?.includes(objective.description));
        const value = row?.querySelector('.environment-value');
        if (!value) continue;

        if (objective.type === 'harvest_quality') {
            value.textContent = `Best ${Math.round(objective.current)}% / ${objective.required}%`;
            value.setAttribute('aria-label', `Best harvest quality ${Math.round(objective.current)} percent; target ${objective.required} percent`);
        } else if (objective.type === 'maintain_environment_status') {
            value.textContent = `${objective.current}/${objective.required} checks`;
        } else if (objective.type === 'advanced_equipment_owned') {
            value.textContent = `${objective.current}/${objective.required} advanced`;
        }
    }
    card.dataset.progressionEnhanced = 'true';
}

function enhanceEquipmentShop(game) {
    const card = findCardByHeading('Equipment Counter');
    if (!card || card.dataset.progressionEnhanced === 'true') return;

    const catalog = game.getEquipmentCatalog();
    const rows = [...card.querySelectorAll('.environment-row')];
    for (const row of rows) {
        const nameNode = row.querySelector('.environment-label strong');
        const meta = row.querySelector('.environment-label span');
        const visibleName = nameNode?.textContent?.replace(/^✓\s*/, '').trim();
        const item = catalog.find(entry => entry.name === visibleName);
        if (!item || !meta) continue;

        const details = [];
        if (Number(item.tier) > 0) details.push(`Tier ${item.tier}`);
        if (Number(item.environmentScoreBonus) > 0) details.push(`stability +${item.environmentScoreBonus}`);
        if (details.length) meta.textContent += ` • ${details.join(' • ')}`;
    }
    card.dataset.progressionEnhanced = 'true';
}

function enhance() {
    scheduled = false;
    const game = Game.current;
    if (!game || !scene) return;
    enhanceQuestTracker(game);
    enhanceRoomCard(game);
    enhanceEquipmentShop(game);
}

function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(enhance);
}

if (scene) {
    new MutationObserver(scheduleEnhance).observe(scene, { childList: true, subtree: true });
    scheduleEnhance();
}
