export class ReactionAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.lastStepAt = 0;
    this.muted = false;
  }

  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.18;
    this.master.connect(this.context.destination);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.context) this.master.gain.setTargetAtTime(muted ? 0 : 0.18, this.context.currentTime, 0.02);
  }

  tone({ frequency = 440, duration = 0.08, type = 'sine', gain = 0.2, slideTo = null } = {}) {
    this.unlock();
    if (!this.context || !this.master || this.muted) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), now + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  step(now, dashing = false) {
    const interval = dashing ? 165 : 260;
    if (now - this.lastStepAt < interval) return;
    this.lastStepAt = now;
    this.tone({ frequency: dashing ? 115 : 90, duration: 0.045, type: 'triangle', gain: 0.11, slideTo: 70 });
  }

  interact() {
    this.tone({ frequency: 420, duration: 0.09, type: 'sine', gain: 0.2, slideTo: 620 });
  }

  pickup() {
    this.tone({ frequency: 520, duration: 0.12, type: 'triangle', gain: 0.22, slideTo: 880 });
    window.setTimeout(() => this.tone({ frequency: 780, duration: 0.14, type: 'triangle', gain: 0.16, slideTo: 1040 }), 70);
  }

  denied() {
    this.tone({ frequency: 190, duration: 0.12, type: 'sawtooth', gain: 0.14, slideTo: 120 });
  }

  hurt() {
    this.tone({ frequency: 160, duration: 0.15, type: 'square', gain: 0.14, slideTo: 75 });
  }

  celebrate() {
    [392, 523, 659].forEach((frequency, index) => window.setTimeout(() => this.tone({ frequency, duration: 0.16, type: 'triangle', gain: 0.17, slideTo: frequency * 1.04 }), index * 90));
  }
}
