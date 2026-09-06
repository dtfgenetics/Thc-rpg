import { Game } from './game/Game.js';
import { SaveStore } from './game/SaveStore.js';
import {
    archiveKeeperCutting,
    canArchiveKeeperCutting,
    canPlantKeeperCutting,
    plantKeeperCutting
} from './game/KeeperCuttings.js';

const saves = new SaveStore(localStorage);
const openButton = document.getElementById('btnJournal');
const modal = document.getElementById('journalModal');
const list = document.getElementById('journalList');
const closeButton = document.getElementById('journalClose');
const status = document.getElementById('journalStatus');
let lastFocusedElement = null;

const formatTrait = trait => String(trait || '').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const phenotypeSeedLabel = seed => `#${Number(seed || 0).toString(16).padStart(8, '0').toUpperCase()}`;

function makeElement(tag, className = '', text = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== '') element.textContent = text;
    return element;
}

function announce(message) {
    if (status) status.textContent = message;
}

function notifyGameChanged() {
    document.dispatchEvent(new CustomEvent('thc-rpg:external-state-change'));
}

function persistCurrentGame() {
    const current = Game.current;
    if (!current) return false;
    try {
        return saves.write(current.save());
    } catch (error) {
        console.warn('THC RPG journal save failed:', error);
        return false;
    }
}

function cuttingCount(current, recordId) {
    return current?.inventory?.get?.('clone', recordId) || 0;
}

function renderCuttingActions(card, current, record) {
    if (!record.keeper) return;

    const section = makeElement('div', 'journal-cutting-section');
    const count = cuttingCount(current, record.id);
    const heading = makeElement('div', 'journal-cutting-heading');
    heading.append(
        makeElement('strong', '', 'Keeper stock'),
        makeElement('span', 'journal-cutting-count', `${count} cutting${count === 1 ? '' : 's'} ready`)
    );
    section.append(heading);

    const note = makeElement(
        'p',
        'journal-cutting-note',
        'Game abstraction: marking a Keeper assumes a cutting was preserved before harvest. Propagated cuttings reproduce this phenotype seed.'
    );
    section.append(note);

    const actions = makeElement('div', 'journal-clone-actions');
    const archiveCheck = canArchiveKeeperCutting(current, record.id);
    const archiveButton = makeElement('button', 'journal-cutting-button', '✂️ Propagate Cutting');
    archiveButton.type = 'button';
    archiveButton.dataset.journalArchiveCutting = record.id;
    archiveButton.disabled = !archiveCheck.ok;
    archiveButton.title = archiveCheck.ok ? 'Add one cutting from preserved Keeper stock.' : 'Keeper stock is unavailable.';
    actions.append(archiveButton);

    const plantCheck = canPlantKeeperCutting(current, record.id);
    const plantButton = makeElement('button', 'journal-cutting-button primary', '🌱 Plant Cutting');
    plantButton.type = 'button';
    plantButton.dataset.journalPlantCutting = record.id;
    plantButton.disabled = !plantCheck.ok;
    const reasons = {
        grow_room_required: 'Travel to the Grow Room first.',
        grow_space_occupied: 'Harvest or clear the current plant first.',
        cutting_required: 'Propagate a cutting first.',
        keeper_required: 'Mark this phenotype as a Keeper first.'
    };
    plantButton.title = plantCheck.ok ? 'Plant this cutting with the saved phenotype seed.' : (reasons[plantCheck.reason] || 'This cutting cannot be planted yet.');
    actions.append(plantButton);
    section.append(actions);
    card.append(section);
}

function renderJournal() {
    if (!list) return;
    const current = Game.current;
    const records = current?.getGrowJournal?.() || [];
    list.replaceChildren();

    const summary = makeElement('div', 'journal-summary');
    const keeperCount = records.filter(record => record.keeper).length;
    const totalCuttings = records.reduce((sum, record) => sum + cuttingCount(current, record.id), 0);
    summary.append(
        makeElement('strong', '', `${records.length} recorded grow${records.length === 1 ? '' : 's'}`),
        makeElement('span', '', `${keeperCount} keeper${keeperCount === 1 ? '' : 's'} · ${totalCuttings} cutting${totalCuttings === 1 ? '' : 's'}`)
    );
    list.append(summary);

    if (!records.length) {
        const empty = makeElement('div', 'journal-empty');
        empty.append(
            makeElement('strong', '', 'No harvests recorded yet.'),
            makeElement('p', '', 'Finish a grow and harvest it. The phenotype and outcome will be saved here automatically.')
        );
        list.append(empty);
        return;
    }

    for (const record of records) {
        const card = makeElement('article', `journal-card${record.keeper ? ' keeper' : ''}`);
        card.dataset.journalId = record.id;

        const heading = makeElement('header', 'journal-card-heading');
        const title = makeElement('div');
        title.append(
            makeElement('strong', '', `${record.keeper ? '⭐ ' : ''}${record.plantName}`),
            makeElement('span', '', `Phenotype ${phenotypeSeedLabel(record.phenotypeSeed)}`)
        );
        const keeper = makeElement('button', 'journal-keeper-button', record.keeper ? '★ Keeper' : '☆ Mark Keeper');
        keeper.type = 'button';
        keeper.dataset.journalKeeper = record.id;
        keeper.setAttribute('aria-pressed', String(record.keeper));
        keeper.setAttribute('aria-label', `${record.keeper ? 'Remove keeper mark from' : 'Mark as keeper'} ${record.plantName} phenotype ${phenotypeSeedLabel(record.phenotypeSeed)}`);
        heading.append(title, keeper);
        card.append(heading);

        const metrics = makeElement('div', 'journal-metrics');
        [
            ['Yield', `${record.yield}g`],
            ['Quality', `${Math.round(record.quality)}%`],
            ['Room', `${Math.round(record.finalEnvironmentScore)}%`],
            ['Vigor', `${Math.round(record.vigor)}%`],
            ['Resilience', `${Math.round(record.resilience)}%`],
            ['Flower', `${record.floweringDays}d`]
        ].forEach(([label, value]) => {
            const metric = makeElement('div', 'journal-metric');
            metric.append(makeElement('span', '', label), makeElement('strong', '', value));
            metrics.append(metric);
        });
        card.append(metrics);

        const traits = makeElement('div', 'journal-traits');
        if (record.dominantTraits.length) {
            record.dominantTraits.forEach(trait => traits.append(makeElement('span', 'journal-trait', formatTrait(trait))));
        } else {
            traits.append(makeElement('span', 'journal-trait muted', 'No dominant traits'));
        }
        card.append(traits);

        renderCuttingActions(card, current, record);

        if (record.harvestedAt) {
            const date = new Date(record.harvestedAt);
            if (!Number.isNaN(date.getTime())) card.append(makeElement('small', 'journal-date', `Harvested ${date.toLocaleString()}`));
        }

        list.append(card);
    }
}

function openJournal() {
    if (!Game.current || !modal) return;
    lastFocusedElement = document.activeElement;
    renderJournal();
    modal.style.display = 'flex';
    closeButton?.focus();
}

function closeJournal() {
    if (!modal) return;
    modal.style.display = 'none';
    lastFocusedElement?.focus?.();
}

function handleKeeper(button, current) {
    if (!current.toggleGrowJournalKeeper(button.dataset.journalKeeper)) return;
    persistCurrentGame();
    announce('Keeper selection updated and saved.');
    renderJournal();
}

function handleArchiveCutting(button, current) {
    const result = archiveKeeperCutting(current, button.dataset.journalArchiveCutting);
    if (!result.ok) {
        announce('That phenotype cannot produce Keeper stock yet.');
        return;
    }
    persistCurrentGame();
    announce(`Cutting propagated. ${result.count} ready from this Keeper stock.`);
    renderJournal();
}

function handlePlantCutting(button, current) {
    const result = plantKeeperCutting(current, button.dataset.journalPlantCutting);
    if (!result.ok) {
        const messages = {
            grow_room_required: 'Travel to the Grow Room before planting a cutting.',
            grow_space_occupied: 'The grow space is already occupied.',
            cutting_required: 'Propagate a cutting from this Keeper first.',
            keeper_required: 'This phenotype is not marked as a Keeper.'
        };
        announce(messages[result.reason] || 'The cutting could not be planted.');
        renderJournal();
        return;
    }
    persistCurrentGame();
    notifyGameChanged();
    announce(`${result.record.plantName} cutting planted with phenotype ${phenotypeSeedLabel(result.record.phenotypeSeed)}.`);
    renderJournal();
}

openButton?.addEventListener('click', openJournal);
closeButton?.addEventListener('click', closeJournal);
list?.addEventListener('click', event => {
    const button = event.target.closest('button');
    const current = Game.current;
    if (!button || !current) return;
    if (button.dataset.journalKeeper) handleKeeper(button, current);
    else if (button.dataset.journalArchiveCutting) handleArchiveCutting(button, current);
    else if (button.dataset.journalPlantCutting) handlePlantCutting(button, current);
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal?.style.display === 'flex') {
        event.preventDefault();
        closeJournal();
    }
    if (event.key.toLowerCase() === 'j' && Game.current && modal?.style.display !== 'flex' && !(event.target instanceof HTMLInputElement) && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        openJournal();
    }
});
