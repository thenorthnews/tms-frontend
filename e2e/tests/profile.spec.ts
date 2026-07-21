import { test, expect } from '@playwright/test';

test('profile', async ({ page }) => {
  // update user:
  await page.goto('/app');
  await page.getByRole('button', { name: 'Open user menu' }).click();
  await page.getByRole('menuitem', { name: 'Your Profile' }).click();
  
  // Update Father's name on profile details form
  await page.getByLabel("Father's Name").click();
  await page.getByLabel("Father's Name").fill('Test Father');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  // Verify toast notification
  await expect(page.getByText('Account profile details updated successfully')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // Verify the saved value persists in the input
  await expect(page.getByLabel("Father's Name")).toHaveValue('Test Father');
});
