import { expect, type Page } from '@playwright/test';

/** Existing gameplay tests still enter through the real first-visit choice. */
export async function openTitle(page: Page, sound: 'on' | 'off' = 'off') {
  await page.goto('/');
  await expect(page.locator('.title-screen')).toBeVisible();
  if ((await page.locator('.title-dialog').count()) > 0) {
    await page
      .getByRole('button', {
        name: sound === 'on' ? '音ありで進む' : '音なしで進む',
      })
      .press('Enter');
  }
  await expect(page.getByRole('heading', { name: 'ECHO ROOM' })).toBeVisible();
}
