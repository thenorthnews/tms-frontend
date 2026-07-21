import { test, expect } from '@playwright/test';

test('teams module - add team member', async ({ page }) => {
  await page.goto('/app');
  
  // Click on the Teams navigation link
  await page.getByRole('link', { name: 'Teams' }).click();
  await page.waitForURL('/app/teams');
  
  // Wait for the teams list to load
  await expect(page.getByText('Team Roster Management')).toBeVisible();
  
  // Click Add Member button
  await page.getByRole('button', { name: 'Add Member' }).click();
  
  // Fill the add member form
  await page.getByPlaceholder('John').fill('Test');
  await page.getByPlaceholder('Doe').fill('Member');
  await page.getByPlaceholder('john.doe@taskflow.com').fill(`testmember.${Date.now()}@test.com`);
  await page.getByPlaceholder('••••••••').fill('password123');
  await page.getByPlaceholder('1234567890').fill('1234567890');
  
  // Select role using CSS selector on select element
  await page.locator('form select').selectOption('employee');
 
  // Submit the form
  await page.locator('button[type="submit"]').click();

  // Verify close
  await page.getByRole('button', { name: 'Close' }).click();
});
