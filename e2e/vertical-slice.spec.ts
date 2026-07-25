import { expect, request as requestFactory, test, type APIRequestContext, type TestInfo } from "@playwright/test";

const API_URL = "http://127.0.0.1:4000";

type PlayerSummary = { id: string; handle: string };
type BattleStart = { id: string };

async function post<T>(api: APIRequestContext, path: string, data: Record<string, unknown>): Promise<T> {
  const response = await api.post(path, { data });
  const body = await response.text();
  expect(response.ok(), `${path} returned ${response.status()}: ${body}`).toBeTruthy();
  return JSON.parse(body) as T;
}

async function prepareRivalBattle(testInfo: TestInfo): Promise<{ player: PlayerSummary; battle: BattleStart }> {
  const api = await requestFactory.newContext({ baseURL: API_URL });
  try {
    const player = await post<PlayerSummary>(api, "/dev/player", {
      handle: `Browser ${testInfo.project.name} ${Date.now()}`
    });

    await post(api, "/quests/start", { playerId: player.id, questSlug: "clear-resin-wall" });
    await post(api, "/quests/advance", {
      playerId: player.id,
      questSlug: "clear-resin-wall",
      actionType: "TALK",
      targetSlug: "garden-keeper-intro"
    });
    await post(api, "/inventory/pickup", { playerId: player.id, itemSlug: "grinder-relic", quantity: 1 });
    await post(api, "/quests/advance", {
      playerId: player.id,
      questSlug: "clear-resin-wall",
      actionType: "PICKUP",
      targetSlug: "grinder-relic"
    });
    await post(api, "/interactions/use-tool", {
      playerId: player.id,
      toolSlug: "grinder-relic",
      obstacleSlug: "resin-wall-grove"
    });
    await post(api, "/quests/advance", {
      playerId: player.id,
      questSlug: "clear-resin-wall",
      actionType: "USE_TOOL",
      targetSlug: "resin-wall-grove"
    });
    await post(api, "/quests/advance", {
      playerId: player.id,
      questSlug: "clear-resin-wall",
      actionType: "RETURN",
      targetSlug: "garden-keeper-intro"
    });
    await post(api, "/quests/claim", { playerId: player.id, questSlug: "clear-resin-wall" });
    await post(api, "/savepoints/use", {
      playerId: player.id,
      savePointSlug: "growers-grove-cure-station"
    });

    const battle = await post<BattleStart>(api, "/battles/start", {
      playerId: player.id,
      npcSlug: "rival-grower-ashtray"
    });
    return { player, battle };
  } finally {
    await api.dispose();
  }
}

test("Grower's Grove renders as a playable Phaser overworld", async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/games/pheno-quest/grove");
  await expect(page.getByRole("heading", { name: "Grower’s Grove" })).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByText(/DTF Demo Grower/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Interact" })).toBeVisible();

  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(350);
  await page.keyboard.up("ArrowRight");

  const screenshot = await page.screenshot({ fullPage: true });
  await testInfo.attach(`growers-grove-${testInfo.project.name}`, { body: screenshot, contentType: "image/png" });
  expect(consoleErrors, `Browser console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
});

test("a prepared overworld battle loads the real party and rival teams", async ({ page }, testInfo) => {
  const { player, battle } = await prepareRivalBattle(testInfo);
  const params = new URLSearchParams({
    battleId: battle.id,
    playerId: player.id,
    returnTo: "/games/pheno-quest/grove"
  });

  await page.goto(`/games/pheno-quest?${params.toString()}`);
  await expect(page.getByRole("heading", { name: "THC: Pheno Quest" })).toBeVisible();
  await expect(page.getByText("Ashtray battle loaded from Grower’s Grove.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your Party" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Enemy Party" })).toBeVisible();
  await expect(page.getByText("Blue Mango", { exact: true })).toBeVisible();
  await expect(page.getByText("Kush Bruiser", { exact: true })).toBeVisible();

  const screenshot = await page.screenshot({ fullPage: true });
  await testInfo.attach(`ashtray-battle-${testInfo.project.name}`, { body: screenshot, contentType: "image/png" });
});
