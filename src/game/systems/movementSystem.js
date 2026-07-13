export const MOVEMENT = Object.freeze({
  WALK_SPEED: 155,
  DASH_SPEED: 270,
  DASH_DRAIN_PER_SECOND: 28,
  ENERGY_RECOVERY_PER_SECOND: 18,
  MIN_DASH_ENERGY: 8
});

export function normalizeVector(x, y) {
  const length = Math.hypot(x, y);
  if (length === 0) return { x: 0, y: 0, magnitude: 0 };
  return { x: x / length, y: y / length, magnitude: Math.min(1, length) };
}

export function computeMovementIntent(input, energy) {
  const direction = normalizeVector(input.x, input.y);
  const moving = direction.magnitude > 0;
  const dashing = moving && Boolean(input.dash) && energy >= MOVEMENT.MIN_DASH_ENERGY;
  const speed = dashing ? MOVEMENT.DASH_SPEED : MOVEMENT.WALK_SPEED;
  return {
    moving,
    dashing,
    facing: direction.x === 0 && direction.y === 0 ? null : dominantFacing(direction.x, direction.y),
    velocity: { x: direction.x * speed, y: direction.y * speed }
  };
}

export function nextEnergy(current, { dashing, moving }, deltaSeconds) {
  const change = dashing && moving
    ? -MOVEMENT.DASH_DRAIN_PER_SECOND * deltaSeconds
    : MOVEMENT.ENERGY_RECOVERY_PER_SECOND * deltaSeconds;
  return Math.max(0, Math.min(100, current + change));
}

export function dominantFacing(x, y) {
  if (Math.abs(x) > Math.abs(y)) return x < 0 ? 'left' : 'right';
  return y < 0 ? 'up' : 'down';
}
