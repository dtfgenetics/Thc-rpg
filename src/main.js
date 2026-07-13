import { createGame } from './game/config.js';

const errorBox = document.querySelector('#boot-error');

function boot() {
  if (!window.Phaser) {
    errorBox.hidden = false;
    errorBox.textContent = 'The game engine could not load. Check the connection and reload the page.';
    return;
  }

  try {
    createGame('game-root');
  } catch (error) {
    console.error(error);
    errorBox.hidden = false;
    errorBox.textContent = 'The overworld failed to start. Reload the page; if the problem continues, report the browser and device.';
  }
}

boot();
