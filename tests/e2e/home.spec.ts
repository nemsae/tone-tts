import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display home page with Solo and Multiplayer options', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('Tongue Twister Challenge');
    await expect(page.getByText('Solo Play')).toBeVisible();
    await expect(page.getByText('Multiplayer')).toBeVisible();
  });

  test('should navigate to solo page when clicking Solo Play', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Solo Play').click();

    await expect(page).toHaveURL(/\/solo/);
    await expect(page.locator('h1')).toContainText('Solo Challenge');
  });

  test('should navigate to multiplayer page when clicking Multiplayer', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Multiplayer').click();

    await expect(page).toHaveURL(/\/multiplayer/);
    await expect(page.locator('h1')).toContainText('Create Multiplayer Game');
  });
});
