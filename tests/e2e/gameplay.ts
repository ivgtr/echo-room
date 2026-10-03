import { expect, type Page } from '@playwright/test';

export async function startNewGame(page: Page, sound: 'on' | 'off' = 'off') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page
    .getByRole('button', {
      name: sound === 'on' ? '音ありで進む' : '音なしで進む',
    })
    .press('Enter');
  await page.getByRole('button', { name: 'ゲーム開始' }).press('Enter');
  await advanceNarratives(page, 7, '探索を始める');
}

export async function advanceNarratives(
  page: Page,
  count: number,
  finalAction = '次の文章へ',
) {
  const message = page.locator('.narrative-panel:visible');
  for (let index = 0; index < count; index += 1) {
    await expect(message).toBeVisible();
    await expect(message.locator('.narrative-text')).toHaveAttribute(
      'data-text-complete',
      'true',
    );
    const currentText = await message.textContent();
    await message
      .getByRole('button', {
        name: index === count - 1 ? finalAction : '次の文章へ',
      })
      .press('Enter');
    await expect
      .poll(() => message.allTextContents())
      .not.toEqual([currentText]);
  }
  await expect(message).toBeHidden();
}

export async function restorePower(page: Page) {
  await page.getByRole('button', { name: /左を向く（西側/ }).press('Enter');
  await page.getByRole('button', { name: 'ブレーカーを調べる' }).press('Enter');
  const device = page.locator('[data-puzzle-id="puzzle_power_route"]');
  for (const name of [
    'DOOR回路、ON',
    'TERMINAL回路、OFF',
    'INTERCOM回路、OFF',
    'ECHO BUFFER回路、OFF',
  ]) {
    await device.getByRole('button', { name }).press('Enter');
  }
  await expect(device).toBeHidden();
  await expect(
    page.getByText('MAIN POWER ONLINE', { exact: true }),
  ).toBeVisible();
  await advanceNarratives(page, 3);
}
