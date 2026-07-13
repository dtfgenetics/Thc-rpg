import test from 'node:test';
import assert from 'node:assert/strict';
import { GameStore, reduceGameState } from '../src/game/state/gameStore.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

test('quest actions advance objective and inventory', () => {
  const store = new GameStore(memoryStorage());
  store.dispatch({ type: 'MET_SEED_MAN' });
  store.dispatch({ type: 'COLLECT_GLOW_SEED' });
  store.dispatch({ type: 'VISIT_RESEARCH_SHRINE' });
  const state = store.getState();
  assert.equal(state.player.seedCount, 1);
  assert.deepEqual(state.player.inventory, ['Glow Seed']);
  assert.equal(state.flags.visitedResearchShrine, true);
  assert.match(state.objective, /complete/i);
});

test('shrine cannot complete before collecting the seed', () => {
  const store = new GameStore(memoryStorage());
  const original = store.getState();
  const next = reduceGameState(original, { type: 'VISIT_RESEARCH_SHRINE' });
  assert.equal(next, original);
});
