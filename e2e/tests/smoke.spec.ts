import { test, expect } from '@playwright/test';

test('smoke - tasks flow', async ({ page }) => {
  const taskTitle = `Test Task ${Date.now()}`;
  const taskDesc = 'This is a description for the automated test task.';

  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.waitForURL('/app');

  // Go to Tasks module
  await page.getByRole('link', { name: 'Tasks' }).click();
  await page.waitForURL('/app/tasks');

  // Click Create Task
  await page.getByRole('button', { name: 'Create Task' }).click();
  await page.waitForURL('/app/tasks/create');

  // Fill in Task form
  await page.getByLabel('Task Title').fill(taskTitle);
  await page.getByLabel('Description').fill(taskDesc);
  await page.getByLabel('Priority').selectOption('1'); // Medium

  // Submit the form
  await page.getByRole('button', { name: 'Create Task' }).click();

  // Wait for redirect back to tasks list
  await page.waitForURL('/app/tasks');

  // Verify task appears in the list
  await expect(page.getByText(taskTitle)).toBeVisible();

  // Click Kanban Board tab
  await page.getByRole('button', { name: 'Kanban Board' }).click();
  await expect(page.getByText(taskTitle)).toBeVisible();

  // Click the task card in the Kanban view to open details/edit page
  await page.getByText(taskTitle).first().click();

  // It should open the task details page
  await expect(page.getByText('Activity & Comments')).toBeVisible();

  // Add a comment
  const commentText = `Automated comment ${Date.now()}`;
  await page.getByPlaceholder('Write a comment or feedback...').fill(commentText);
  await page.getByRole('button', { name: 'Send' }).click();

  // Verify comment is displayed in activities
  await expect(page.getByText(commentText)).toBeVisible();
});
