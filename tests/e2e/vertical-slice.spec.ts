import { expect, test } from '@playwright/test';

test('keyboard-capable route restores power and resumes after reload', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ゲーム開始' }).click();
  for (let index = 0; index < 6; index += 1)
    await page.getByRole('button', { name: '次へ' }).click();
  await page.getByRole('button', { name: '探索を始める' }).click();
  await page.getByRole('button', { name: '音声 ON' }).click();
  await page.getByRole('button', { name: '西壁を見る' }).click();
  await page.getByRole('button', { name: 'ブレーカーを調べる' }).click();

  await page.getByRole('button', { name: '回路 1' }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByText('接続順が違う。全レバーが戻った。もう一度試せる。'),
  ).toBeVisible();
  await page.getByRole('button', { name: '音高の視覚補助：OFF' }).click();
  for (const name of [
    /回路 3、音高レベル 1/,
    /回路 1、音高レベル 2/,
    /回路 4、音高レベル 3/,
    /回路 2、音高レベル 4/,
  ]) {
    await page.getByRole('button', { name }).focus();
    await page.keyboard.press('Enter');
  }

  await expect(page.getByText('MAIN POWER ONLINE')).toBeVisible();
  await expect(page.getByText('電源復旧地点を自動保存しました')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '続きから' }).click();
  await expect(page.getByText('MAIN POWER ONLINE')).toBeVisible();
  await expect(page.getByText('よし。次は端末だ。')).toBeVisible();
});

test.describe('touch input', () => {
  test.use({ hasTouch: true });

  test('touch reaches the same breaker puzzle', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'ゲーム開始' }).tap();
    for (let index = 0; index < 6; index += 1) {
      await page.getByRole('button', { name: '次へ' }).tap();
    }
    await page.getByRole('button', { name: '探索を始める' }).tap();
    await page.getByRole('button', { name: '西壁を見る' }).tap();
    await page.getByRole('button', { name: 'ブレーカーを調べる' }).tap();
    await expect(
      page.getByRole('heading', { name: '非常電源ブレーカー' }),
    ).toBeVisible();
  });
});
