import { OverworldScene } from './scenes/OverworldScene.js';

export function createGame(parent) {
  const Phaser = window.Phaser;
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#173c2b',
    pixelArt: false,
    antialias: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: window.innerWidth,
      height: window.innerHeight
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: new URLSearchParams(window.location.search).has('debug')
      }
    },
    scene: [OverworldScene]
  });
}
