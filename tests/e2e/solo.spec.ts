import { test, expect } from '@playwright/test';

test.describe('Solo Page', () => {
  test('should display solo page with game settings', async ({ page }) => {
    await page.goto('/solo');

    await expect(page.locator('h1')).toContainText('Solo Challenge');
    await expect(page.getByText('Theme')).toBeVisible();
    await expect(page.getByText('Difficulty')).toBeVisible();
    await expect(page.getByText('Rounds')).toBeVisible();
  });

  test('should have back button that navigates to home', async ({ page }) => {
    await page.goto('/solo');

    await page.locator('button:has-text("Back")').click();

    await expect(page).toHaveURL('/');
  });

  test('should select topic from predefined options', async ({ page }) => {
    await page.goto('/solo');

    await page.getByText('Animals').click();

    await expect(page.getByText('Animals')).toHaveClass(/selected/);
  });

  test('should show error when trying to start without topic', async ({ page }) => {
    await page.goto('/solo');

    await page.locator('button:has-text("Start Game")').click();

    await expect(page.locator('.error, [class*="error"]')).toContainText(
      'Please select or enter a topic'
    );
  });
});
