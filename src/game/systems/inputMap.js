export class InputMap {
  constructor(scene) {
    this.scene = scene;
    this.touch = { up: false, down: false, left: false, right: false, dash: false, interact: false };
    this.previousInteract = false;
    this.previousMute = false;
    this.keys = scene.input.keyboard?.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D',
      up2: 'UP', down2: 'DOWN', left2: 'LEFT', right2: 'RIGHT',
      dash: 'SHIFT', interact: 'E', interact2: 'SPACE', mute: 'M'
    }) ?? {};
    this.bindTouchControls();
  }

  bindTouchControls() {
    for (const button of document.querySelectorAll('[data-input]')) {
      const action = button.dataset.input;
      const press = (event) => { event.preventDefault(); this.touch[action] = true; };
      const release = (event) => { event.preventDefault(); this.touch[action] = false; };
      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('pointerleave', release);
    }
  }

  consumeTouchInteract() {
    this.touch.interact = false;
  }

  read() {
    const held = (name) => Boolean(this.keys[name]?.isDown);
    const interactHeld = held('interact') || held('interact2') || this.touch.interact;
    const muteHeld = held('mute');
    const result = {
      x: Number(held('right') || held('right2') || this.touch.right) - Number(held('left') || held('left2') || this.touch.left),
      y: Number(held('down') || held('down2') || this.touch.down) - Number(held('up') || held('up2') || this.touch.up),
      dash: held('dash') || this.touch.dash,
      interactPressed: interactHeld && !this.previousInteract,
      mutePressed: muteHeld && !this.previousMute
    };
    this.previousInteract = interactHeld;
    this.previousMute = muteHeld;
    if (this.touch.interact) this.consumeTouchInteract();
    return result;
  }
}
