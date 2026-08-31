import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SaveStore } from '../src/game/SaveStore.js';

class MemoryStorage {
    constructor() { this.values = new Map(); }
    getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
    setItem(key, value) { this.values.set(key, String(value)); }
    removeItem(key) { this.values.delete(key); }
}

describe('SaveStore', () => {
    it('writes a primary save and rotates the previous valid primary into backup', () => {
        const storage = new MemoryStorage();
        const saves = new SaveStore(storage);
        assert.equal(saves.write({ version: 5, player: { name: 'First' } }), true);
        assert.equal(saves.read().data.player.name, 'First');
        assert.equal(saves.write({ version: 5, player: { name: 'Second' } }), true);
        assert.equal(JSON.parse(storage.getItem('thc-rpg-save-backup')).player.name, 'First');
        assert.equal(saves.read().data.player.name, 'Second');
    });

    it('falls back to backup when the primary record is malformed', () => {
        const storage = new MemoryStorage();
        const saves = new SaveStore(storage);
        storage.setItem('thc-rpg-save-backup', JSON.stringify({ version: 5, player: { name: 'Recovered' } }));
        storage.setItem('thc-rpg-save', '{broken json');
        const result = saves.read();
        assert.equal(result.source, 'backup');
        assert.equal(result.data.player.name, 'Recovered');
    });

    it('does not replace a good backup with a malformed current primary', () => {
        const storage = new MemoryStorage();
        const saves = new SaveStore(storage);
        storage.setItem('thc-rpg-save-backup', JSON.stringify({ version: 5, marker: 'safe' }));
        storage.setItem('thc-rpg-save', 'not-json');
        saves.write({ version: 5, marker: 'new' });
        assert.equal(JSON.parse(storage.getItem('thc-rpg-save-backup')).marker, 'safe');
        assert.equal(saves.read().data.marker, 'new');
    });

    it('reports whether any recoverable save exists and clears both slots', () => {
        const storage = new MemoryStorage();
        const saves = new SaveStore(storage);
        assert.equal(saves.hasSave(), false);
        saves.write({ version: 5 });
        assert.equal(saves.hasSave(), true);
        saves.clear();
        assert.equal(saves.hasSave(), false);
        assert.equal(storage.getItem('thc-rpg-save'), null);
        assert.equal(storage.getItem('thc-rpg-save-backup'), null);
    });
});
