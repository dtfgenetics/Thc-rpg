export class PlayerAnimationController {
  constructor(scene, sprite, shadow) {
    this.scene = scene;
    this.sprite = sprite;
    this.shadow = shadow;
    this.state = 'idle';
    this.time = 0;
  }

  setState(next) {
    if (next === this.state) return;
    this.state = next;
    this.sprite.clearTint();
    this.scene.tweens.killTweensOf(this.sprite);

    if (next === 'interact') {
      this.scene.tweens.add({ targets: this.sprite, scaleX: 1.12, scaleY: 0.9, duration: 100, yoyo: true, ease: 'Sine.Out' });
    } else if (next === 'hurt') {
      this.sprite.setTint(0xff7a70);
      this.scene.tweens.add({ targets: this.sprite, x: this.sprite.x + 5, duration: 45, yoyo: true, repeat: 3 });
    } else if (next === 'celebrate') {
      this.scene.tweens.add({ targets: this.sprite, y: this.sprite.y - 22, angle: 10, duration: 150, yoyo: true, repeat: 1, ease: 'Sine.Out' });
    }
  }

  update(deltaMs, velocity, facing) {
    this.time += deltaMs;
    const speed = Math.hypot(velocity.x, velocity.y);
    const moving = speed > 1;
    const dash = this.state === 'dash';
    const bob = moving ? Math.sin(this.time * (dash ? 0.025 : 0.016)) * (dash ? 3.2 : 1.8) : Math.sin(this.time * 0.004) * 0.8;
    this.sprite.setScale(1 + (moving ? Math.abs(bob) * 0.012 : Math.sin(this.time * 0.003) * 0.012));
    this.sprite.setAngle(moving ? Math.max(-7, Math.min(7, velocity.x / 18)) : this.sprite.angle * 0.88);
    this.shadow.setPosition(this.sprite.x, this.sprite.y + 21);
    this.shadow.setScale(dash ? 1.25 : moving ? 1.08 : 1, dash ? 0.72 : 1);
    this.sprite.setFlipX(facing === 'left');
  }
}
