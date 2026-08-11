import { expect, test } from '@playwright/test';

test('sound lifecycle follows play, SYSTEM, visibility, and master settings', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const audit = { started: 0, stopped: 0, resumed: 0 };
    Object.defineProperty(window, '__soundAudit', { value: audit });

    class FakeParam {
      value = 1;
      setValueAtTime(value: number) {
        this.value = value;
      }
      exponentialRampToValueAtTime(value: number) {
        this.value = value;
      }
    }
    class FakeNode {
      connect() {
        return this;
      }
      disconnect() {}
    }
    class FakeGain extends FakeNode {
      gain = new FakeParam();
    }
    class FakeOscillator extends FakeNode {
      frequency = new FakeParam();
      type: OscillatorType = 'sine';
      onended: (() => void) | null = null;
      start() {
        audit.started += 1;
      }
      stop() {
        audit.stopped += 1;
      }
    }
    class FakeAudioContext {
      currentTime = 0;
      destination = new FakeNode();
      state: AudioContextState = 'suspended';
      createGain() {
        return new FakeGain();
      }
      createOscillator() {
        return new FakeOscillator();
      }
      async resume() {
        this.state = 'running';
        audit.resumed += 1;
      }
      async close() {
        this.state = 'closed';
      }
    }

    window.AudioContext = FakeAudioContext as unknown as typeof AudioContext;
  });

  const readAudit = () =>
    page.evaluate(
      () =>
        (
          window as unknown as {
            __soundAudit: { started: number; stopped: number; resumed: number };
          }
        ).__soundAudit,
    );

  await page.goto('/');
  await page.getByRole('button', { name: 'ゲーム開始' }).click();
  await expect.poll(async () => (await readAudit()).started).toBe(2);
  expect((await readAudit()).resumed).toBe(1);

  await page.getByRole('button', { name: 'SYSTEM' }).click();
  await expect.poll(async () => (await readAudit()).stopped).toBe(2);
  await page
    .getByRole('dialog', { name: 'SYSTEM' })
    .getByRole('button', { name: 'RESUME / ゲームへ戻る' })
    .click();
  await expect.poll(async () => (await readAudit()).started).toBe(4);

  await page.evaluate(() => {
    document.documentElement.dataset.testVisibility = 'hidden';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => document.documentElement.dataset.testVisibility,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(async () => (await readAudit()).stopped).toBe(4);
  await page.evaluate(() => {
    document.documentElement.dataset.testVisibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(async () => (await readAudit()).started).toBe(6);

  await page.getByRole('button', { name: 'SYSTEM' }).click();
  const system = page.getByRole('dialog', { name: 'SYSTEM' });
  await system
    .getByRole('button', { name: 'TEXT & SOUND / 字幕・サウンド設定' })
    .click();
  await system.getByRole('button', { name: /MASTER \/ サウンド ON/ }).click();
  await system.getByRole('button', { name: 'RESUME / ゲームへ戻る' }).click();
  await expect.poll(async () => (await readAudit()).started).toBe(6);
});
