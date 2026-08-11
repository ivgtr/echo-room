import { expect, test } from '@playwright/test';

test('title enters the shared game state', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ECHO ROOM' })).toBeVisible();
  await page.getByRole('button', { name: 'ゲーム開始' }).click();
  await expect(page.getByText('BATTERY 00:19:48')).toBeVisible();
  await expect(
    page.getByText('室内は非常灯の赤い光に沈んでいる。'),
  ).toBeVisible();
});
