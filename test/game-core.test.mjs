import assert from 'node:assert/strict';
import { applyEffects, createInitialState, getCurrentEncounterId, rankForRun, resolveChoice, runScore, seededShuffle } from '../src/game-core.mjs';

const ids = ['a','b','c','d','e','f','g','h'];
assert.deepEqual(seededShuffle(ids, 'same'), seededShuffle(ids, 'same'));
assert.notDeepEqual(seededShuffle(ids, 'same'), seededShuffle(ids, 'different'));

let state = createInitialState({ seed: 'test-run', encounterIds: ids });
assert.equal(state.turn, 0);
assert.equal(state.status, 'playing');
assert.equal(new Set(state.encounterOrder).size, ids.length);
assert.ok(ids.includes(getCurrentEncounterId(state)));

const clamped = applyEffects({ ...state, vigor: 98, stress: 2, energy: 5 }, { vigor: 99, stress: -99, energy: 99 });
assert.equal(clamped.vigor, 100);
assert.equal(clamped.stress, 0);
assert.equal(clamped.energy, 6);

const encounter = { id: 'a', title: 'Test', lesson: 'Verify the evidence.' };
const best = { id: 'best', label: 'Best', quality: 'best', effects: { vigor: 5, stress: -5, knowledge: 3, energy: -1, score: 100 }, feedback: 'Good.' };
state = resolveChoice(state, encounter, best);
assert.equal(state.turn, 1);
assert.equal(state.bestChoices, 1);
assert.equal(state.history.length, 1);
assert.equal(state.history[0].lesson, encounter.lesson);
assert.ok(runScore(state) > state.score);

const tired = { ...state, energy: 0 };
const recovery = resolveChoice(tired, encounter, { ...best, effects: { ...best.effects, energy: -2 } });
assert.equal(recovery.turn, tired.turn);
assert.equal(recovery.energy, 2);
assert.equal(recovery.history.at(-1).quality, 'recovery');

const finishing = { ...state, turn: ids.length - 1, encounterOrder: ids, vigor: 80, stress: 20 };
const complete = resolveChoice(finishing, encounter, best);
assert.equal(complete.status, 'complete');
assert.notEqual(rankForRun(complete), 'Room Reset');

const failing = resolveChoice({ ...state, vigor: 2, stress: 90 }, encounter, {
  id: 'bad', label: 'Bad', quality: 'poor', effects: { vigor: -10, stress: 15, energy: 0, score: 0 }, feedback: 'Bad.'
});
assert.equal(failing.status, 'failed');
assert.equal(rankForRun(failing), 'Room Reset');

console.log('THC RPG game-core tests passed.');
