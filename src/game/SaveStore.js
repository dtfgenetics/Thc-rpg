const parseSave = raw => {
    if (typeof raw !== 'string' || raw.length === 0) return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
};

export class SaveStore {
    constructor(storage, options = {}) {
        if (!storage?.getItem || !storage?.setItem || !storage?.removeItem) {
            throw new Error('SaveStore requires a Storage-compatible adapter');
        }
        this.storage = storage;
        this.primaryKey = options.primaryKey || 'thc-rpg-save';
        this.backupKey = options.backupKey || `${this.primaryKey}-backup`;
    }

    write(data) {
        if (!data || typeof data !== 'object') return false;
        const serialized = JSON.stringify(data);
        const current = this.storage.getItem(this.primaryKey);
        if (parseSave(current)) this.storage.setItem(this.backupKey, current);
        this.storage.setItem(this.primaryKey, serialized);
        return true;
    }

    read() {
        const primary = parseSave(this.storage.getItem(this.primaryKey));
        if (primary) return { data: primary, source: 'primary' };
        const backup = parseSave(this.storage.getItem(this.backupKey));
        if (backup) return { data: backup, source: 'backup' };
        return null;
    }

    hasSave() {
        return Boolean(this.read());
    }

    clear() {
        this.storage.removeItem(this.primaryKey);
        this.storage.removeItem(this.backupKey);
    }
}
