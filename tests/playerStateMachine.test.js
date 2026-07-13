import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAYER_STATES, PlayerStateMachine } from '../src/game/state/playerStateMachine.js';

test('movement states transition normally', () => {
  const machine = new PlayerStateMachine();
  assert.equal(machine.transition(PLAYER_STATES.WALK, { now: 10 }), true);
  assert.equal(machine.state, PLAYER_STATES.WALK);
  assert.equal(machine.transition(PLAYER_STATES.DASH, { now: 20 }), true);
  assert.equal(machine.state, PLAYER_STATES.DASH);
});

test('interaction lock blocks movement until expiry', () => {
  const machine = new PlayerStateMachine();
  machine.transition(PLAYER_STATES.INTERACT, { now: 100, lockMs: 400 });
  assert.equal(machine.isMovementLocked(200), true);
  assert.equal(machine.transition(PLAYER_STATES.WALK, { now: 200 }), false);
  machine.update(500);
  assert.equal(machine.state, PLAYER_STATES.IDLE);
});
