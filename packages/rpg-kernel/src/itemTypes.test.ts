import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canStack, isKeyTool, type ItemTemplateView } from "./itemTypes.js";

const grinder: ItemTemplateView = {
  slug: "grinder-relic",
  name: "Grinder Relic",
  kind: "KEY_TOOL",
  description: "Breaks brittle resin walls.",
  stackable: false,
  useContext: "MAP",
  effect: { type: "CLEAR_OBSTACLE", unlockSlug: "cleared:resin-wall-grove" }
};

const tonic: ItemTemplateView = {
  slug: "terp-tonic",
  name: "Terp Tonic",
  kind: "CONSUMABLE",
  description: "Restores HP outside battle in later builds.",
  stackable: true,
  useContext: "MENU",
  effect: { type: "HEAL_HP", amount: 30 }
};

describe("item helpers", () => {
  it("detects key tools", () => {
    assert.equal(isKeyTool(grinder), true);
    assert.equal(isKeyTool(tonic), false);
  });

  it("only stacks stackable non-key items", () => {
    assert.equal(canStack(grinder), false);
    assert.equal(canStack(tonic), true);
  });
});
