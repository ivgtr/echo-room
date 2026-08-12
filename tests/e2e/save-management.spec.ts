import { expect, test } from '@playwright/test';

import { createSettingsSave, installSettingsSave } from './saveFixture';

test('corrupt progress is protected until confirmed deletion and settings remain', async ({
  page,
}) => {
  await page.addInitScript(
    installSettingsSave,
    createSettingsSave({
      soundEnabled: false,
      visualAssist: true,
      motionReduced: true,
      introSeen: true,
      soundLevels: { effects: 35, environment: 55 },
      subtitleSettings: {
        size: 'large',
        background: 'solid',
        speed: 'fast',
      },
    }),
  );
  await page.addInitScript(() => {
    localStorage.setItem('echo-room:progress', '{bad json');
  });
  await page.goto('/');

  await expect(page.getByRole('alert')).toContainText(
    'このデータを消すまで新しい進行は保存されません',
  );
  await expect(page.getByRole('button', { name: '続きから' })).toHaveCount(0);
  await page.getByRole('button', { name: '保存データを消去' }).click();
  const confirmation = page.getByRole('group', {
    name: '保存データ消去の確認',
  });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: '消去する' }).click();

  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => ({
        progress: localStorage.getItem('echo-room:progress'),
        settings: localStorage.getItem('echo-room:settings'),
      })),
    )
    .toEqual({
      progress: null,
      settings: expect.stringContaining('"size":"large"'),
    });
});
