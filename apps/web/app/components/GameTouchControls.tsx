"use client";

import type { ReactNode } from "react";

export type MobileDirection = "up" | "down" | "left" | "right";

export type MobileInputState = Record<MobileDirection, boolean>;

type GameTouchControlsProps = {
  onDirectionChange: (direction: MobileDirection, pressed: boolean) => void;
  onStopMovement: () => void;
  onInteract: () => void;
  onFullscreen: () => void;
};

export function GameTouchControls({
  onDirectionChange,
  onStopMovement,
  onInteract,
  onFullscreen
}: GameTouchControlsProps) {
  return (
    <div className="mobile-control-panel" aria-label="Touch controls for Seed Man">
      <div className="mobile-dpad" onPointerLeave={onStopMovement} onPointerCancel={onStopMovement}>
        <span />
        <MobileControlButton label="Up" onPressChange={(pressed) => onDirectionChange("up", pressed)}>
          ▲
        </MobileControlButton>
        <span />
        <MobileControlButton label="Left" onPressChange={(pressed) => onDirectionChange("left", pressed)}>
          ◀
        </MobileControlButton>
        <button className="mobile-control-button mobile-stop-button" type="button" onClick={onStopMovement}>
          •
        </button>
        <MobileControlButton label="Right" onPressChange={(pressed) => onDirectionChange("right", pressed)}>
          ▶
        </MobileControlButton>
        <span />
        <MobileControlButton label="Down" onPressChange={(pressed) => onDirectionChange("down", pressed)}>
          ▼
        </MobileControlButton>
        <span />
      </div>
      <div className="mobile-action-stack">
        <button className="mobile-action-button" type="button" onClick={onInteract}>
          Interact
        </button>
        <button className="mobile-secondary-button" type="button" onClick={onFullscreen}>
          Fullscreen
        </button>
      </div>
    </div>
  );
}

function MobileControlButton({
  children,
  label,
  onPressChange
}: {
  children: ReactNode;
  label: string;
  onPressChange: (pressed: boolean) => void;
}) {
  return (
    <button
      aria-label={label}
      className="mobile-control-button"
      type="button"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onPressChange(true);
      }}
      onPointerUp={(event) => {
        event.currentTarget.releasePointerCapture(event.pointerId);
        onPressChange(false);
      }}
      onPointerCancel={() => onPressChange(false)}
      onPointerLeave={() => onPressChange(false)}
    >
      {children}
    </button>
  );
}
