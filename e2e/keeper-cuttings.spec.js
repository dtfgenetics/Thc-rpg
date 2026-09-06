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
  await expect(journal.getByText(/Phenotype #0EB6138B/i)).toBeVisible();
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

test('Keeper Journal actions advance the post-Phenotype-Hunt campaign in the browser', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('#loading')).toBeHidden();

  await page.evaluate(async () => {
    const { Game } = await import('/src/game/Game.js');
    const gameData = await fetch('/src/data/game-data.json').then(response => response.json());
    const game = new Game('Campaign Browser Tester', gameData);
    game.quests.completed = ['first_seed', 'dial_it_in', 'phenotype_hunt'];
    game.startQuest('keeper_standard');
    game.inventory.add('seed', 'mango_bubbles', 1);
    game.plantSeed('mango_bubbles', 31415926);
    game.plant.phenotype.qualityPotential = 100;
    game.plant.health = 100;
    game.plant.stress = 0;
    game.plant.development = 100;
    game.plant.updateStage();
    game.harvest();
    localStorage.setItem('thc-rpg-save', JSON.stringify(game.save()));
  });

  await page.reload();
  await expect(page.locator('#loading')).toBeHidden();
  await page.getByRole('button', { name: /Load Save/i }).click();
  const loadedDialog = page.getByRole('dialog', { name: /Loaded!/i });
  await expect(loadedDialog).toBeVisible();
  await loadedDialog.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Open pheno grow journal' }).click();
  const journal = page.getByRole('dialog', { name: /Pheno Grow Journal/i });
  await journal.getByRole('button', { name: /Mark as keeper Mango Bubbles/i }).click();
  await journal.getByRole('button', { name: /Propagate Cutting/i }).click();

  const keeperProgress = await page.evaluate(async () => {
    const { Game } = await import('/src/game/Game.js');
    const state = Game.current.getQuestProgress('keeper_standard');
    return { ready: Game.current.isQuestReady('keeper_standard'), objectives: state.objectives.map(item => [item.id, item.completed]) };
  });
  expect(keeperProgress.ready).toBe(true);
  expect(keeperProgress.objectives).toEqual([
    ['select_mango_keeper', true],
    ['archive_mango_cutting', true]
  ]);

  await page.evaluate(async () => {
    const { Game } = await import('/src/game/Game.js');
    Game.current.completeQuest('keeper_standard');
    Game.current.startQuest('clone_proof');
  });
  await journal.getByRole('button', { name: /Plant Cutting/i }).click();

  const cloneProgress = await page.evaluate(async () => {
    const { Game } = await import('/src/game/Game.js');
    const state = Game.current.getQuestProgress('clone_proof');
    return {
      geneticsId: Game.current.plant?.geneticsId,
      seed: Game.current.plant?.phenotype?.seed,
      plantedObjective: state.objectives.find(item => item.id === 'plant_keeper_clone')?.completed
    };
  });
  expect(cloneProgress.geneticsId).toBe('mango_bubbles');
  expect(cloneProgress.seed).toBe(31415926);
  expect(cloneProgress.plantedObjective).toBe(true);
  expect(errors).toEqual([]);
});
