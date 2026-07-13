export class Hud {
  constructor() {
    this.objective = document.querySelector('#objective-text');
    this.state = document.querySelector('#player-state');
    this.energy = document.querySelector('#energy-value');
    this.seedCount = document.querySelector('#seed-count');
    this.prompt = document.querySelector('#interaction-prompt');
    this.toast = document.querySelector('#toast');
    this.soundToggle = document.querySelector('#sound-toggle');
    this.toastTimer = null;
  }

  updateGameState(gameState) {
    this.objective.textContent = gameState.objective;
    this.energy.textContent = String(Math.round(gameState.player.energy));
    this.seedCount.textContent = String(gameState.player.seedCount);
  }

  setPlayerState(state) {
    this.state.textContent = state.toUpperCase();
  }

  setPrompt(label, visible) {
    this.prompt.hidden = !visible;
    this.prompt.querySelector('span').textContent = label || 'Interact';
  }

  onPromptClick(handler) {
    this.prompt.addEventListener('click', handler);
  }

  onSoundToggle(handler) {
    this.soundToggle.addEventListener('click', handler);
  }

  setSoundMuted(muted) {
    this.soundToggle.textContent = muted ? 'Sound Off' : 'Sound On';
    this.soundToggle.setAttribute('aria-pressed', String(muted));
  }

  showToast(message, duration = 3200) {
    clearTimeout(this.toastTimer);
    this.toast.textContent = message;
    this.toast.classList.add('visible');
    this.toastTimer = setTimeout(() => this.toast.classList.remove('visible'), duration);
  }
}
