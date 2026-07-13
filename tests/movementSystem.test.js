import test from 'node:test';
import assert from 'node:assert/strict';
import { MOVEMENT, computeMovementIntent, nextEnergy, normalizeVector } from '../src/game/systems/movementSystem.js';

test('diagonal movement is normalized', () => {
  const vector = normalizeVector(1, 1);
  assert.ok(Math.abs(Math.hypot(vector.x, vector.y) - 1) < 0.00001);
});

test('dash is faster and consumes energy', () => {
  const walk = computeMovementIntent({ x: 1, y: 0, dash: false }, 100);
  const dash = computeMovementIntent({ x: 1, y: 0, dash: true }, 100);
  assert.equal(walk.velocity.x, MOVEMENT.WALK_SPEED);
  assert.equal(dash.velocity.x, MOVEMENT.DASH_SPEED);
  assert.ok(nextEnergy(100, dash, 1) < 100);
});
