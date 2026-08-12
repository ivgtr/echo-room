import { expect, test } from '@playwright/test';

import { createProgressSave, installProgressSave } from './saveFixture';

test('active-time warnings pause safely and reserve power survives reload', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.addInitScript(
    installProgressSave,
    createProgressSave({ activeElapsedMs: 560_000 }),
  );

  await page.goto('/');
  await page.getByRole('button', { name: '続きから' }).click();
  const stage = page.locator('.logical-stage');
  const hud = page.locator('.status-cluster');
  await expect(stage).toHaveAttribute('data-power-phase', 'normal');
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1_000);

  await page.clock.fastForward(30_000);
  await expect(stage).toHaveAttribute('data-power-phase', 'low');
  await expect(hud.getByRole('status')).toHaveText('LOW POWER / 残量10分以下');

  await page.getByRole('button', { name: 'SYSTEM' }).click();
  const system = page.getByRole('dialog', { name: 'SYSTEM' });
  await expect(system.getByText(/MAIN POWER ONLINE \/ PAUSED/)).toBeVisible();
  const pausedTime = await system.locator('time').textContent();
  await page.clock.fastForward(5_000);
  await expect(system.locator('time')).toHaveText(pausedTime ?? '');
  await system.getByRole('button', { name: 'RESUME / ゲームへ戻る' }).click();

  await page.evaluate(() => {
    document.documentElement.dataset.testVisibility = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => document.documentElement.dataset.testVisibility,
    });
    document.documentElement.dataset.testVisibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.fastForward(1);
  const hiddenTime = await hud.locator('time').textContent();
  await page.clock.fastForward(5_000);
  await expect(hud.locator('time')).toHaveText(hiddenTime ?? '');
  await page.evaluate(() => {
    document.documentElement.dataset.testVisibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
  });

  await page.clock.fastForward(300_000);
  await expect(stage).toHaveAttribute('data-power-phase', 'critical');
  await expect(hud.getByRole('status')).toContainText('CRITICAL');
  await expect(page.getByTestId('world-canvas')).toHaveCSS(
    'animation-iteration-count',
    '1',
  );

  await page.clock.fastForward(301_000);
  await expect(stage).toHaveAttribute('data-power-phase', 'reserve');
  await expect(hud.getByText('00:00:00')).toBeVisible();
  await expect(hud.getByRole('status')).toContainText('予備電源稼働中');

  await page.getByRole('button', { name: '端末を調べる' }).click();
  await page.clock.fastForward(400);
  await expect(page.getByRole('dialog', { name: '端末' })).toBeVisible();
  await page
    .getByRole('dialog', { name: '端末' })
    .getByRole('button', { name: 'BACK / 部屋に戻る' })
    .click();

  await page.reload();
  await page.getByRole('button', { name: '続きから' }).click();
  await expect(stage).toHaveAttribute('data-power-phase', 'reserve');
  await expect(hud.getByText('00:00:00')).toBeVisible();
});
