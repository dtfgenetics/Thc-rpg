// Reading localStorage itself can throw when persistence is blocked by policy.
export function createBrowserStorage(scope = globalThis) {
    let storage = null;
    try { storage = scope.localStorage; } catch { /* Gameplay remains available. */ }
    return {
        getItem(key) {
            try { return storage?.getItem(key) ?? null; } catch { return null; }
        },
        setItem(key, value) {
            if (!storage) throw new Error('Browser saving is unavailable. Allow site storage to save progress.');
            storage.setItem(key, value);
        },
        removeItem(key) {
            try { storage?.removeItem(key); } catch { /* A blocked store has no accessible save. */ }
        }
    };
}
export const browserStorage = createBrowserStorage();
