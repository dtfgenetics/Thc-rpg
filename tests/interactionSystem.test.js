import test from 'node:test';
import assert from 'node:assert/strict';
import { findBestInteraction } from '../src/game/systems/interactionSystem.js';

test('selects an active target in front of the player', () => {
  const target = findBestInteraction(
    { x: 0, y: 0, facing: 'right' },
    [
      { id: 'behind', x: -20, y: 0, active: true, priority: 10 },
      { id: 'front', x: 40, y: 0, active: true, priority: 1 }
    ],
    { radius: 80, facingThreshold: 0 }
  );
  assert.equal(target.id, 'front');
});

test('priority resolves competing valid targets', () => {
  const target = findBestInteraction(
    { x: 0, y: 0, facing: 'down' },
    [
      { id: 'sign', x: 0, y: 30, active: true, priority: 1 },
      { id: 'quest', x: 5, y: 40, active: true, priority: 5 }
    ]
  );
  assert.equal(target.id, 'quest');
});
