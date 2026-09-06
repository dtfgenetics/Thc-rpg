import { Game } from './game/Game.js';
import { SaveStore } from './game/SaveStore.js';

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

function renderJournal() {
    if (!list) return;
    const current = Game.current;
    const records = current?.getGrowJournal?.() || [];
    list.replaceChildren();

    const summary = makeElement('div', 'journal-summary');
    const keeperCount = records.filter(record => record.keeper).length;
    summary.append(
        makeElement('strong', '', `${records.length} recorded grow${records.length === 1 ? '' : 's'}`),
        makeElement('span', '', `${keeperCount} keeper${keeperCount === 1 ? '' : 's'} marked`)
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

openButton?.addEventListener('click', openJournal);
closeButton?.addEventListener('click', closeJournal);
list?.addEventListener('click', event => {
    const button = event.target.closest('[data-journal-keeper]');
    if (!button || !Game.current) return;
    if (!Game.current.toggleGrowJournalKeeper(button.dataset.journalKeeper)) return;
    persistCurrentGame();
    if (status) status.textContent = 'Keeper selection updated and saved.';
    renderJournal();
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
