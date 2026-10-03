import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowserStorage } from '../src/game/BrowserStorage.js';
import { SaveStore } from '../src/game/SaveStore.js';
test('blocked localStorage getter does not prevent startup or new-game clearing', () => {
    const scope = Object.defineProperty({}, 'localStorage', { get() { throw new Error('SecurityError'); } });
    const storage = createBrowserStorage(scope);
    const saves = new SaveStore(storage);
    assert.equal(saves.hasSave(), false);
    assert.doesNotThrow(() => saves.clear());
    assert.throws(() => saves.write({ version: 6 }), /saving is unavailable/);
});
test('blocked reads and deletes are safe, while failed writes never report success', () => {
    const storage = createBrowserStorage({ localStorage: {
        getItem() { throw new Error('SecurityError'); },
        removeItem() { throw new Error('SecurityError'); },
        setItem() { throw new Error('QuotaExceededError'); }
    }});
    assert.equal(storage.getItem('save'), null);
    assert.doesNotThrow(() => storage.removeItem('save'));
    assert.throws(() => storage.setItem('save', '{}'), /QuotaExceededError/);
});
test('normal saves and backup recovery retain the existing storage keys', () => {
    const data = new Map();
    const storage = createBrowserStorage({ localStorage: {
        getItem: key => data.get(key) ?? null,
        setItem: (key, value) => data.set(key, value),
        removeItem: key => data.delete(key)
    }});
    const saves = new SaveStore(storage);
    saves.write({ version: 6, name: 'First' });
    saves.write({ version: 6, name: 'Second' });
    data.set('thc-rpg-save', 'broken');
    assert.equal(saves.read().source, 'backup');
    assert.equal(saves.read().data.name, 'First');
});
