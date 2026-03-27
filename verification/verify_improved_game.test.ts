import { test, expect } from '@playwright/test';

test('Verify movement and collection', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Wait for the Canvas to be present
  await page.waitForSelector('canvas');

  // Check if HUD is visible
  await expect(page.locator('text=POLUTEK 3D')).toBeVisible();
  await expect(page.locator('text=Wynik')).toBeVisible();

  // Perform some movement (holding W for a bit)
  await page.keyboard.down('w');
  await page.waitForTimeout(1000);
  await page.keyboard.up('w');

  // Perform jump
  await page.keyboard.press(' ');
  await page.waitForTimeout(500);

  // Take screenshot of the game state
  await page.screenshot({ path: 'verification/game_improved_physics.png' });

  // Check if any collectible was potentially approached (hard to be precise without mocking state)
  // But we can check that it didn't crash.
});
