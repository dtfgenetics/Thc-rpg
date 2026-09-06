import { expect, test } from '@playwright/test';

function collectErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test('propagates a Keeper cutting and replants the exact phenotype', async ({ page }) => {
  const errors = collectErrors(page);
  const phenotypeSeed = 246813579;

  await page.goto('/');
  await expect(page.locator('#loading')).toBeHidden();

  const recordId = await page.evaluate(async seed => {
    const { Game } = await import('/src/game/Game.js');
    const gameData = await fetch('/src/data/game-data.json').then(response => response.json());
    const game = new Game('Keeper Browser Tester', gameData);
    game.inventory.add('seed', 'blue_mango', 1);
    game.plantSeed('blue_mango', seed);
    game.plant.development = 100;
    game.plant.updateStage();
    const result = game.harvest();
    game.toggleGrowJournalKeeper(result.journalEntry.id, true);
    localStorage.setItem('thc-rpg-save', JSON.stringify(game.save()));
    return result.journalEntry.id;
  }, phenotypeSeed);

  await page.reload();
  await expect(page.locator('#loading')).toBeHidden();
  await page.getByRole('button', { name: /Load Save/i }).click();
  const loadedDialog = page.getByRole('dialog', { name: /Loaded!/i });
  await expect(loadedDialog).toBeVisible();
  await loadedDialog.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Open pheno grow journal' }).click();
  const journal = page.getByRole('dialog', { name: /Pheno Grow Journal/i });
  await expect(journal).toBeVisible();
  await expect(journal.getByText(/Phenotype #0EB613CB/i)).toBeVisible();
  await expect(journal.getByText(/0 cuttings ready/i)).toBeVisible();

  await journal.getByRole('button', { name: /Propagate Cutting/i }).click();
  await expect(journal.getByText(/1 cutting ready/i)).toBeVisible();
  await expect(page.locator('#journalStatus')).toContainText('Cutting propagated');

  await journal.getByRole('button', { name: /Plant Cutting/i }).click();
  await expect(page.locator('#journalStatus')).toContainText('cutting planted');
  await expect(journal.getByText(/0 cuttings ready/i)).toBeVisible();

  const state = await page.evaluate(async id => {
    const { Game } = await import('/src/game/Game.js');
    return {
      recordId: id,
      hasPlant: Boolean(Game.current?.plant),
      geneticsId: Game.current?.plant?.geneticsId ?? null,
      phenotypeSeed: Game.current?.plant?.phenotype?.seed ?? null,
      cuttingCount: Game.current?.inventory?.get('clone', id) ?? -1
    };
  }, recordId);

  expect(state.hasPlant).toBe(true);
  expect(state.geneticsId).toBe('blue_mango');
  expect(state.phenotypeSeed).toBe(phenotypeSeed);
  expect(state.cuttingCount).toBe(0);
  expect(errors).toEqual([]);
});
