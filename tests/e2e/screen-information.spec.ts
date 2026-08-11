import { expect, test, type Page } from '@playwright/test';

async function enterRoom(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'ゲーム開始' }).click();
  for (let index = 0; index < 6; index += 1) {
    await expect(page.locator('.narrative-text')).toHaveAttribute(
      'data-text-complete',
      'true',
    );
    await page.getByRole('button', { name: '次へ' }).click();
  }
  await expect(page.locator('.narrative-text')).toHaveAttribute(
    'data-text-complete',
    'true',
  );
  await page.getByRole('button', { name: '探索を始める' }).click();
}

test('clock and desk compose exact story information over close-up art', async ({
  page,
}) => {
  await enterRoom(page);
  const clockHotspot = page.getByRole('button', {
    name: 'アナログ時計を調べる',
  });
  await clockHotspot.click();
  const clock = page.getByRole('dialog', { name: '停止したアナログ時計' });
  await expect(clock.getByText('02:17')).toBeVisible();
  await expect(clock).toHaveCSS(
    'background-image',
    /gfx-close-002__blank-face__preview-flat\.webp/,
  );
  await clock.getByRole('button', { name: '閉じる' }).click();
  await expect(clockHotspot).toBeFocused();

  await page.getByRole('button', { name: /右を向く（東壁/ }).click();
  await page.getByRole('button', { name: /右を向く（南壁/ }).click();
  await page.getByRole('button', { name: 'デスクの紙を調べる' }).click();
  const document = page.getByRole('dialog', {
    name: 'EMERGENCY POWER TEST',
  });
  await expect(
    document.getByText('周波数の低い回路から接続すること'),
  ).toBeVisible();
  await expect(document).toHaveCSS(
    'background-image',
    /gfx-close-004__paper-present__preview-flat\.webp/,
  );
});
