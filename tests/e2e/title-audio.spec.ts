import { expect, test, type Page } from '@playwright/test';
import { createProgressSave, installProgressSave } from './saveFixture';

async function auditAudio(page: Page) {
  await page.addInitScript(() => {
    const audit = { created: 0, oscillators: 0 };
    Object.defineProperty(window, '__titleAudioAudit', { value: audit });
    const NativeContext = window.AudioContext;
    window.AudioContext = class extends NativeContext {
      constructor() {
        super();
        audit.created += 1;
      }
      createOscillator() {
        audit.oscillators += 1;
        return super.createOscillator();
      }
    };
  });
}
const audit = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as {
          __titleAudioAudit: { created: number; oscillators: number };
        }
      ).__titleAudioAudit,
  );

const soundPrompt = (page: Page) =>
  page.getByRole('dialog', { name: 'サウンドを有効にしますか' });

async function expectSilentPreference(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('echo-room:settings')!).soundEnabled,
      ),
    )
    .toBe(false);
}

test('first visit is keyboard-accessible, silent by default, and remembered', async ({
  page,
}) => {
  await auditAudio(page);
  await page.goto('/');
  await expect(soundPrompt(page)).toBeVisible();
  await expect(page.locator('.title-composition')).toHaveAttribute('inert', '');
  const yes = page.getByRole('button', { name: '音ありで進む' });
  const no = page.getByRole('button', { name: '音なしで進む' });
  await expect(yes).toBeFocused();
  expect((await audit(page)).created).toBe(0);
  await page.keyboard.press('Tab');
  await expect(no).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(soundPrompt(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'ゲーム開始' })).toBeFocused();
  await expectSilentPreference(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'ECHO ROOM' })).toBeVisible();
  await expect(soundPrompt(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'ゲーム開始' }).press('Enter');
  await expect(page.locator('.narrative-panel')).toBeVisible();
  expect((await audit(page)).created).toBe(0);
});

test('real Web Audio unlock is explicit and renewed after reloading', async ({
  page,
}) => {
  await auditAudio(page);
  await page.goto('/');
  await page.getByRole('button', { name: '音ありで進む' }).click();
  await expect(soundPrompt(page)).toHaveCount(0);
  expect((await audit(page)).created).toBe(1);
  expect((await audit(page)).oscillators).toBe(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'ECHO ROOM' })).toBeVisible();
  expect((await audit(page)).created).toBe(0);
  await page.getByRole('button', { name: 'ゲーム開始' }).click();
  await expect
    .poll(async () => (await audit(page)).oscillators)
    .toBeGreaterThan(0);
  expect((await audit(page)).created).toBe(1);
});

test('audio failure offers retry and a playable silent route', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: class {
        constructor() {
          throw new Error('Audio unavailable');
        }
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: '音ありで進む' }).click();
  await expect(page.getByRole('alert')).toContainText(
    '音を開始できませんでした',
  );
  await page.getByRole('button', { name: '音なしで進む' }).click();
  await page.getByRole('button', { name: 'ゲーム開始' }).click();
  await expect(page.locator('.narrative-panel')).toBeVisible();
});

test('a stalled unlock can be cancelled without a late reply enabling sound', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    let state: AudioContextState = 'suspended';
    window.AudioContext = class extends Native {
      get state() {
        return state;
      }
      resume() {
        return new Promise<void>((resolve) => {
          Object.defineProperty(window, '__finishUnlock', {
            configurable: true,
            value: () => {
              state = 'running';
              resolve();
            },
          });
        });
      }
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: '音ありで進む' }).click();
  await expect(
    page.getByRole('button', { name: 'サウンドを準備中…' }),
  ).toBeVisible();
  await page.getByRole('button', { name: '音なしで進む' }).click();
  await page.evaluate(() =>
    (window as unknown as { __finishUnlock: () => void }).__finishUnlock(),
  );
  await expectSilentPreference(page);
  await page.getByRole('button', { name: '設定', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'サウンド：OFF' }),
  ).toBeVisible();
});

test('settings return one level at a time and preserve the continue checkpoint', async ({
  page,
}) => {
  await page.addInitScript(installProgressSave, createProgressSave());
  await page.goto('/');
  await expect(soundPrompt(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(soundPrompt(page)).toHaveCount(0);
  const settings = page.getByRole('button', { name: '設定', exact: true });
  await settings.press('Enter');
  await page.getByRole('button', { name: 'サウンド：OFF' }).press('Enter');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('dialog', { name: '設定', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(settings).toBeFocused();
  await page.getByRole('button', { name: 'ゲーム開始' }).press('Enter');
  await expect(
    page.getByRole('dialog', { name: '最初から始めますか' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '続きから' }).press('Enter');
  await expect(
    page.getByRole('button', { name: 'SYSTEM', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'SYSTEM', exact: true }).click();
  await page.getByRole('button', { name: /RETURN TO TITLE/ }).click();
  await expect(page.getByRole('button', { name: '続きから' })).toBeVisible();
});

test('storage writes failing do not break silent play or falsely remember the choice', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('quota');
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: '音なしで進む' }).click();
  await page.getByRole('button', { name: 'ゲーム開始' }).click();
  await expect(page.locator('.narrative-panel')).toBeVisible();
  await page.reload();
  await expect(soundPrompt(page)).toBeVisible();
});

test('a missing title image does not hide the menu or block starting', async ({
  page,
}) => {
  await page.route('**/gfx-wide-001/emergency.webp', (route) => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: '音なしで進む' }).click();
  await expect(page.locator('.title-scene__room')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'ゲーム開始' })).toBeEnabled();
});

for (const [width, height] of [
  [1440, 900],
  [1280, 720],
  [844, 390],
  [568, 320],
  [390, 844],
  [320, 568],
] as const) {
  test(`title and initial sound choice fit ${width}x${height}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(soundPrompt(page)).toBeVisible();
    await expect(page.locator('.title-scene__room')).toBeAttached();
    await page
      .locator('.title-scene__room')
      .evaluate((img: HTMLImageElement) => img.decode());
    for (const name of ['音ありで進む', '音なしで進む']) {
      const button = page.getByRole('button', { name });
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeInViewport();
      const box = await button.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({
      path: info.outputPath(`sound-${width}x${height}.png`),
    });
    await page.getByRole('button', { name: '音なしで進む' }).click();
    await expect(
      page.getByRole('heading', { name: 'ECHO ROOM' }),
    ).toBeInViewport();
    await expect(
      page.getByRole('button', { name: 'ゲーム開始' }),
    ).toBeInViewport();
    await expect(
      page.getByRole('button', { name: '設定', exact: true }),
    ).toBeInViewport();
    await expect(page.locator('.title-identity')).toHaveCSS(
      'animation-name',
      'none',
    );
    expect(
      await page
        .locator('.title-composition')
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page
      .getByRole('button', { name: 'ゲーム開始' })
      .evaluate((el) => el.blur());
    await page.screenshot({
      path: info.outputPath(`title-${width}x${height}.png`),
    });
  });
}
