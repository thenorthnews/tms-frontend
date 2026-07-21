import { test as setup } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.waitForURL('/auth/login');

  // log in:
  await page.getByLabel('Email Address').click();
  await page.getByLabel('Email Address').fill('admin@gmail.com');
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('/app');

  await page.context().storageState({ path: authFile });
});
