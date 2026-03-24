import { test, expect } from '@playwright/test';

test.describe('Home Page - Solo Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Tongue Twister Challenge');
    await expect(page.locator('p').first()).toHaveText('Test your pronunciation skills!');
  });

  test('displays main title and subtitle', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Tongue Twister Challenge');
    await expect(page.locator('p').first()).toHaveText('Test your pronunciation skills!');
  });

  test('has solo and multiplayer mode buttons', async ({ page }) => {
    const soloButton = page.getByRole('button', { name: 'Solo Play' });
    const multiplayerButton = page.getByRole('button', { name: 'Multiplayer' });

    await expect(soloButton).toBeVisible();
    await expect(multiplayerButton).toBeVisible();
  });

  test('solo mode is selected by default', async ({ page }) => {
    const soloButton = page.getByRole('button', { name: 'Solo Play' });
    await expect(soloButton).toHaveClass(/selected/);
  });

  test('displays topic selection section in solo mode', async ({ page }) => {
    await expect(page.getByText('Theme')).toBeVisible();
    await expect(page.locator('input[placeholder*="Marvel Superheroes"]')).toBeVisible();
    await expect(page.getByText('or select a preset below')).toBeVisible();
  });

  test('displays difficulty options in solo mode', async ({ page }) => {
    await expect(page.getByText('Difficulty')).toBeVisible();
    await expect(page.getByRole('button', { name: /Easy/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Medium/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Hard/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Custom/ })).toBeVisible();
  });

  test('displays rounds slider in solo mode', async ({ page }) => {
    await expect(page.getByText(/Rounds:/)).toBeVisible();
    const rangeInput = page.locator('input[type="range"]');
    await expect(rangeInput).toBeVisible();
  });

  test('displays start game button in solo mode', async ({ page }) => {
    const startButton = page.getByRole('button', { name: 'Start Game' });
    await expect(startButton).toBeVisible();
  });

  test('selects a predefined topic', async ({ page }) => {
    const topicButtons = page.locator('button').filter({ hasText: /^(Animals|Tech|Food)$/ });
    await topicButtons.first().click();
    await expect(topicButtons.first()).toHaveClass(/selected/);
  });

  test('selects difficulty level', async ({ page }) => {
    const hardButton = page.getByRole('button', { name: /Hard/ });
    await hardButton.click();
    await expect(hardButton).toHaveClass(/selected/);
  });

  test('adjusts rounds slider', async ({ page }) => {
    const rangeInput = page.locator('input[type="range"]');
    await rangeInput.fill('5');
    await expect(page.getByText(/Rounds: 5/)).toBeVisible();
  });

  test('shows error when starting game without topic', async ({ page }) => {
    const startButton = page.getByRole('button', { name: 'Start Game' });
    await startButton.click();

    const error = page
      .locator('[class*="error"]')
      .filter({ hasText: /Please select or enter a topic/ });
    await expect(error).toBeVisible();
  });

  test('shows error for custom topic too short', async ({ page }) => {
    const customInput = page.locator('input[placeholder*="Marvel Superheroes"]');
    await customInput.fill('a');

    const startButton = page.getByRole('button', { name: 'Start Game' });
    await startButton.click();

    const error = page
      .locator('[class*="error"]')
      .filter({ hasText: /Custom topic must be at least 2 characters/ });
    await expect(error).toBeVisible();
  });

  test('shows custom difficulty options when Custom is selected', async ({ page }) => {
    const customButton = page.getByRole('button', { name: /Custom/ });
    await customButton.click();

    await expect(page.getByText(/Words:/)).toBeVisible();
    await expect(page.locator('input[type="number"]')).toBeVisible();
  });

  test('shows error for invalid custom difficulty word count', async ({ page }) => {
    const customInput = page.locator('input[placeholder*="Marvel Superheroes"]');
    await customInput.fill('Test Topic');

    const customButton = page.getByRole('button', { name: /Custom/ });
    await customButton.click();

    const numberInput = page.locator('input[type="number"]');
    await numberInput.fill('3');

    const startButton = page.getByRole('button', { name: 'Start Game' });
    await startButton.click();

    const error = page.getByText(/Custom difficulty must be between 5 and 40 words/);
    await expect(error).toBeVisible();
  });
});

test.describe('Home Page - Multiplayer Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Tongue Twister Challenge');
    const multiplayerButton = page.getByRole('button', { name: 'Multiplayer' });
    await multiplayerButton.click();
  });

  test('switches to multiplayer mode', async ({ page }) => {
    const multiplayerButton = page.getByRole('button', { name: 'Multiplayer' });
    await expect(multiplayerButton).toHaveClass(/selected/);
  });

  test('displays create room section in multiplayer mode', async ({ page }) => {
    await expect(page.getByText('Create Room (Host)')).toBeVisible();
    await expect(page.getByPlaceholder('Your name').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Room' })).toBeVisible();
  });

  test('displays join room section in multiplayer mode', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Join Room' })).toBeVisible();
    await expect(page.getByPlaceholder('Room Code (4 letters)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join Room' })).toBeVisible();
  });

  test('displays OR divider between create and join sections', async ({ page }) => {
    await expect(page.getByText('OR', { exact: true })).toBeVisible();
  });

  test('shows error when creating room without name', async ({ page }) => {
    const createButton = page.getByRole('button', { name: 'Create Room' });
    await createButton.click();

    const error = page.locator('[class*="error"]').filter({ hasText: /Please enter your name/ });
    await expect(error).toBeVisible();
  });

  test('shows error when joining room without name', async ({ page }) => {
    const roomCode = page.getByPlaceholder('Room Code (4 letters)');
    await roomCode.fill('ABCD');

    const joinButton = page.getByRole('button', { name: 'Join Room' });
    await joinButton.click();

    const error = page.locator('[class*="error"]').filter({ hasText: /Please enter your name/ });
    await expect(error).toBeVisible();
  });

  test('shows error when joining room with invalid code', async ({ page }) => {
    const nameInput = page.getByPlaceholder('Your name').last();
    await nameInput.fill('TestPlayer');

    const roomCode = page.getByPlaceholder('Room Code (4 letters)');
    await roomCode.fill('AB');

    const joinButton = page.getByRole('button', { name: 'Join Room' }).last();
    await joinButton.click();

    const error = page.getByText(/Please enter a valid 4-character room code/);
    await expect(error).toBeVisible();
  });

  test('uppercases room code input', async ({ page }) => {
    const nameInput = page.getByPlaceholder('Your name').last();
    await nameInput.fill('TestPlayer');

    const roomCode = page.getByPlaceholder('Room Code (4 letters)');
    await roomCode.fill('abcd');

    await expect(roomCode).toHaveValue('abcd');
  });

  test('limits room code to 4 characters', async ({ page }) => {
    const roomCode = page.getByPlaceholder('Room Code (4 letters)');
    await roomCode.fill('ABCDEF');

    await expect(roomCode).toHaveValue('ABCD');
  });
});

test.describe('Home Page - Navigation', () => {
  test('home page loads at root URL', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1')).toHaveText('Tongue Twister Challenge');
  });
});
