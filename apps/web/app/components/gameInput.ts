import type { MobileInputState } from "./GameTouchControls";

export type DigitalInputState = {
  up?: boolean;
  down?: boolean;
  left?: boolean;
  right?: boolean;
};

export type MovementVector = {
  x: number;
  y: number;
};

export function createEmptyMobileInputState(): MobileInputState {
  return { up: false, down: false, left: false, right: false };
}

export function getMovementVector(input: {
  keyboard?: DigitalInputState;
  mobile?: DigitalInputState;
}): MovementVector {
  const keyboard = input.keyboard ?? {};
  const mobile = input.mobile ?? {};

  let x = 0;
  let y = 0;

  if (keyboard.left || mobile.left) x -= 1;
  if (keyboard.right || mobile.right) x += 1;
  if (keyboard.up || mobile.up) y -= 1;
  if (keyboard.down || mobile.down) y += 1;

  if (x === 0 && y === 0) {
    return { x: 0, y: 0 };
  }

  const length = Math.sqrt(x * x + y * y);
  return {
    x: x / length,
    y: y / length
  };
}
