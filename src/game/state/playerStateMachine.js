export const PLAYER_STATES = Object.freeze({
  IDLE: 'idle',
  WALK: 'walk',
  DASH: 'dash',
  INTERACT: 'interact',
  HURT: 'hurt',
  CELEBRATE: 'celebrate'
});

const transitions = {
  idle: new Set(['walk', 'dash', 'interact', 'hurt', 'celebrate']),
  walk: new Set(['idle', 'dash', 'interact', 'hurt']),
  dash: new Set(['idle', 'walk', 'interact', 'hurt']),
  interact: new Set(['idle', 'celebrate', 'hurt']),
  hurt: new Set(['idle']),
  celebrate: new Set(['idle', 'hurt'])
};

export class PlayerStateMachine {
  constructor(initial = PLAYER_STATES.IDLE) {
    this.state = initial;
    this.lockUntil = 0;
    this.listeners = new Set();
  }

  canTransition(next, now = 0) {
    if (next === this.state) return true;
    if (now < this.lockUntil && next !== PLAYER_STATES.HURT) return false;
    return transitions[this.state]?.has(next) ?? false;
  }

  transition(next, { now = 0, lockMs = 0, reason = '' } = {}) {
    if (!this.canTransition(next, now)) return false;
    const previous = this.state;
    this.state = next;
    this.lockUntil = Math.max(this.lockUntil, now + Math.max(0, lockMs));
    if (previous !== next) {
      for (const listener of this.listeners) listener({ previous, current: next, reason });
    }
    return true;
  }

  update(now) {
    if (now >= this.lockUntil && [PLAYER_STATES.INTERACT, PLAYER_STATES.HURT, PLAYER_STATES.CELEBRATE].includes(this.state)) {
      this.transition(PLAYER_STATES.IDLE, { now, reason: 'lock-expired' });
    }
  }

  isMovementLocked(now) {
    return now < this.lockUntil && [PLAYER_STATES.INTERACT, PLAYER_STATES.HURT, PLAYER_STATES.CELEBRATE].includes(this.state);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
