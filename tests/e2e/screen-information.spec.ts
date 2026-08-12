import { expect, test, type Page } from '@playwright/test';

async function enterRoom(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'ゲーム開始' }).click();
  for (let index = 0; index < 6; index += 1) {
    await expect(page.locator('.narrative-text')).toHaveAttribute(
      'data-text-complete',
      'true',
    );
    await page.getByRole('button', { name: '次の文章へ' }).click();
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
    name: '時計を調べる',
  });
  await clockHotspot.click();
  const clock = page.getByRole('dialog', { name: '止まった時計' });
  await expect(clock.getByText('02:17')).toBeVisible();
  await expect(clock).toHaveCSS(
    'background-image',
    /gfx-close-002__blank-face__preview-flat\.webp/,
  );
  await clock.getByRole('button', { name: 'BACK / 戻る' }).click();
  await expect(clockHotspot).toBeFocused();

  await page.getByRole('button', { name: /右を向く（東側/ }).click();
  await page.getByRole('button', { name: /右を向く（南側/ }).click();
  await page.getByRole('button', { name: '机を調べる' }).click();
  const desk = page.getByRole('dialog', {
    name: '机の上',
  });
  await expect(
    desk.getByRole('button', { name: '折り目のついた引き継ぎメモを調べる' }),
  ).toBeVisible();
  await expect(
    desk.getByRole('button', {
      name: '方眼紙に書かれた波形の走り書きを調べる',
    }),
  ).toBeVisible();
  await expect(
    desk.getByRole('button', { name: '書き込みのある夜勤チェック表を調べる' }),
  ).toBeVisible();
  await expect(
    desk.getByRole('button', { name: '交代勤務の小さな付箋を調べる' }),
  ).toBeVisible();
  await expect(
    desk.getByRole('button', { name: '端が破れた買い物メモを調べる' }),
  ).toBeVisible();
  await expect(
    desk.getByRole('button', { name: 'メモの下からのぞく作業写真を調べる' }),
  ).toBeVisible();
  await expect(desk.getByText('読む')).toHaveCount(0);
  await expect(desk).toHaveCSS(
    'background-image',
    /gfx-close-004__desk-evidence-fixed__preview-flat\.webp/,
  );

  await desk
    .getByRole('button', { name: '折り目のついた引き継ぎメモを調べる' })
    .click();
  const handover = page.getByRole('dialog', { name: '机の上' });
  await expect(
    handover.getByText(/焦げ臭い回路は無理に戻さない/),
  ).toBeVisible();
  await handover.getByRole('button', { name: 'DESK / 机に戻る' }).click();
  await page
    .getByRole('dialog', { name: '机の上' })
    .getByRole('button', { name: 'メモの下からのぞく作業写真を調べる' })
    .click();
  await expect(
    page
      .getByRole('dialog', { name: '机の上' })
      .getByRole('img', { name: '端末に向かう、後ろ姿の作業員' }),
  ).toBeVisible();
});
