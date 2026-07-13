const SAVE_KEY = 'thc-rpg-overworld-save-v1';

const initialState = Object.freeze({
  version: 1,
  player: {
    name: 'New Grower',
    energy: 100,
    seedCount: 0,
    inventory: []
  },
  objective: 'Meet Seed Man near the greenhouse.',
  flags: {
    metSeedMan: false,
    collectedGlowSeed: false,
    visitedResearchShrine: false
  }
});

export class GameStore {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.state = this.load();
    this.listeners = new Set();
  }

  getState() {
    return structuredClone(this.state);
  }

  dispatch(action) {
    const next = reduceGameState(this.state, action);
    if (next === this.state) return;
    this.state = next;
    this.save();
    for (const listener of this.listeners) listener(this.getState(), action);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState(), { type: 'STORE_READY' });
    return () => this.listeners.delete(listener);
  }

  save() {
    try { this.storage?.setItem(SAVE_KEY, JSON.stringify(this.state)); } catch { /* Storage is optional. */ }
  }

  load() {
    try {
      const raw = this.storage?.getItem(SAVE_KEY);
      if (!raw) return structuredClone(initialState);
      const parsed = JSON.parse(raw);
      if (parsed.version !== 1) return structuredClone(initialState);
      return {
        ...structuredClone(initialState),
        ...parsed,
        player: { ...structuredClone(initialState).player, ...parsed.player },
        flags: { ...structuredClone(initialState).flags, ...parsed.flags }
      };
    } catch {
      return structuredClone(initialState);
    }
  }
}

export function reduceGameState(state, action) {
  switch (action.type) {
    case 'MET_SEED_MAN':
      return {
        ...state,
        objective: state.flags.collectedGlowSeed ? 'Bring the Glow Seed to the research shrine.' : 'Find the glowing seed beyond Mosswater Trail.',
        flags: { ...state.flags, metSeedMan: true }
      };
    case 'COLLECT_GLOW_SEED':
      if (state.flags.collectedGlowSeed) return state;
      return {
        ...state,
        objective: 'Bring the Glow Seed to the research shrine.',
        player: {
          ...state.player,
          seedCount: state.player.seedCount + 1,
          inventory: [...state.player.inventory, 'Glow Seed']
        },
        flags: { ...state.flags, collectedGlowSeed: true }
      };
    case 'VISIT_RESEARCH_SHRINE':
      if (!state.flags.collectedGlowSeed || state.flags.visitedResearchShrine) return state;
      return {
        ...state,
        objective: 'Overworld foundation complete — explore freely.',
        flags: { ...state.flags, visitedResearchShrine: true }
      };
    case 'SET_ENERGY':
      return {
        ...state,
        player: { ...state.player, energy: Math.max(0, Math.min(100, action.value)) }
      };
    default:
      return state;
  }
}
