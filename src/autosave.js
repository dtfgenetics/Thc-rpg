import { Game } from './game/Game.js';
import { SaveStore } from './game/SaveStore.js';

const AUTOSAVE_INTERVAL_MS = 30_000;
const saves = new SaveStore(localStorage);

function persistCurrentGame() {
    const current = Game.current;
    if (!current) return false;
    try {
        return saves.write(current.save());
    } catch (error) {
        console.warn('THC RPG autosave failed:', error);
        return false;
    }
}

function recoverPrimaryFromBackup() {
    const recovered = saves.read();
    if (recovered?.source !== 'backup') return false;
    try {
        saves.write(recovered.data);
        return true;
    } catch (error) {
        console.warn('THC RPG backup recovery failed:', error);
        return false;
    }
}

recoverPrimaryFromBackup();

const startButton = document.getElementById('startBtn');
startButton?.addEventListener('click', () => {
    saves.clear();
    queueMicrotask(persistCurrentGame);
}, { capture: true });

const manualSaveButton = document.getElementById('btnSave');
manualSaveButton?.addEventListener('click', persistCurrentGame, { capture: true });

window.setInterval(() => {
    if (!document.hidden) persistCurrentGame();
}, AUTOSAVE_INTERVAL_MS);

document.addEventListener('visibilitychange', () => {
    if (document.hidden) persistCurrentGame();
});

window.addEventListener('pagehide', persistCurrentGame);
