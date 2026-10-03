import { expect, test } from '@playwright/test';
import { startNewGame } from './gameplay';

test('real Web Audio starts, pauses, resumes, and respects mute', async ({
  page,
}) => {
  // Observe native nodes rather than maintaining a second Web Audio implementation.
  await page.addInitScript(() => {
    const audit = { created: 0, active: 0 };
    Object.defineProperty(window, '__soundAudit', { value: audit });
    const NativeContext = window.AudioContext;
    window.AudioContext = class extends NativeContext {
      constructor() {
        super();
        audit.created += 1;
      }
      createOscillator() {
        const oscillator = super.createOscillator();
        audit.active += 1;
        oscillator.addEventListener('ended', () => (audit.active -= 1), {
          once: true,
        });
        return oscillator;
      }
    };
  });
  const readAudit = () =>
    page.evaluate(
      () =>
        (
          window as unknown as {
            __soundAudit: { created: number; active: number };
          }
        ).__soundAudit,
    );
  const activeNodes = async () => (await readAudit()).active;

  await startNewGame(page, 'on');
  await expect.poll(activeNodes).toBeGreaterThan(0);
  expect((await readAudit()).created).toBe(1);

  await page.getByRole('button', { name: 'SYSTEM' }).press('Enter');
  const system = page.getByRole('dialog', { name: 'SYSTEM' });
  await expect.poll(activeNodes).toBe(0);
  await system
    .getByRole('button', { name: 'RESUME / ゲームへ戻る' })
    .press('Enter');
  await expect.poll(activeNodes).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'SYSTEM' }).press('Enter');
  await system
    .getByRole('button', { name: 'TEXT & SOUND / 字幕・サウンド設定' })
    .press('Enter');
  await system
    .getByRole('button', { name: /MASTER \/ サウンド ON/ })
    .press('Enter');
  await expect(
    system.getByRole('button', { name: /MASTER \/ サウンド OFF/ }),
  ).toBeVisible();
  await system
    .getByRole('button', { name: 'BACK / SYSTEMへ戻る' })
    .press('Enter');
  await system
    .getByRole('button', { name: 'RESUME / ゲームへ戻る' })
    .press('Enter');
  await expect(system).toBeHidden();
  await expect.poll(activeNodes).toBe(0);
});
