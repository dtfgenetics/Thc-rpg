const facingVectors = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

export function findBestInteraction(player, interactables, { radius = 86, facingThreshold = -0.1 } = {}) {
  const facing = facingVectors[player.facing] ?? facingVectors.down;
  let best = null;

  for (const candidate of interactables) {
    if (!candidate.active) continue;
    const dx = candidate.x - player.x;
    const dy = candidate.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance > (candidate.radius ?? radius) || distance === 0) continue;
    const dot = (dx / distance) * facing.x + (dy / distance) * facing.y;
    if (dot < (candidate.facingThreshold ?? facingThreshold)) continue;
    const score = (candidate.priority ?? 0) * 1000 - distance + dot * 25;
    if (!best || score > best.score) best = { candidate, distance, dot, score };
  }

  return best?.candidate ?? null;
}
