import { expect, test } from '@playwright/test';

function collectErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test('boots, completes onboarding, opens inventory, and saves', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');

  await expect(page.getByRole('dialog', { name: /THC RPG/i })).toBeVisible();
  await expect(page.locator('#loading')).toBeHidden();

  await page.locator('#nameInput').fill('Browser Tester');
  await page.getByRole('button', { name: /Start New Game/i }).click();

  await expect(page.locator('#playerName')).toHaveText('Browser Tester');
  await expect(page.locator('#startModal')).toBeHidden();
  await expect(page.locator('#sceneContent')).not.toBeEmpty();

  const welcome = page.getByRole('dialog', { name: /Welcome, Grower/i });
  await expect(welcome).toBeVisible();
  await welcome.getByRole('button', { name: 'Close' }).click();
  await expect(welcome).toBeHidden();

  await page.getByRole('button', { name: 'Open inventory' }).click();
  const inventory = page.getByRole('dialog', { name: /Inventory/i });
  await expect(inventory).toBeVisible();
  await inventory.getByRole('button', { name: 'Close' }).click();
  await expect(inventory).toBeHidden();

  await page.getByRole('button', { name: /Save game/i }).click();
  const hasSave = await page.evaluate(() => Object.keys(localStorage).some(key => key.toLowerCase().includes('thc') || key.toLowerCase().includes('save')));
  expect(hasSave).toBe(true);
  expect(errors).toEqual([]);
});
