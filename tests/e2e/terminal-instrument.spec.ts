import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { packetTexts, puzzleIds } from '../../src/game/puzzles/storyPuzzles';
import type { SavedProgress } from '../../src/game/save/saveManager';
import {
  createProgressSave,
  createSettingsSave,
  installProgressSave,
  installSettingsSave,
} from './saveFixture';

type TerminalStage = Extract<
  SavedProgress['storyStage'],
  | 'puzzle_carrier_sync'
  | 'puzzle_signal_investigation'
  | 'puzzle_packet_repair'
  | 'puzzle_voiceprint_calibration'
  | 'puzzle_transmission_window'
  | 'transmission_ready'
>;

async function openTerminal(page: Page, stage: TerminalStage, quiet = true) {
  const count =
    stage === 'transmission_ready'
      ? puzzleIds.length
      : puzzleIds.indexOf(stage);
  await page.addInitScript(
    installProgressSave,
    createProgressSave({
      storyStage: stage,
      checkpointId:
        `checkpoint_puzzle_0${count}` as SavedProgress['checkpointId'],
      completedPuzzleIds: puzzleIds.slice(0, count),
      inventory:
        count >= 3
          ? ['item_screwdriver', 'item_staff_card', 'item_floor_map']
          : [],
    }),
  );
  await page.addInitScript(
    installSettingsSave,
    createSettingsSave({
      soundEnabled: !quiet,
      motionReduced: quiet,
      subtitleSettings: {
        size: 'medium',
        background: 'soft',
        speed: 'fast',
      },
    }),
  );
  await page.emulateMedia({
    reducedMotion: quiet ? 'reduce' : 'no-preference',
  });
  await page.goto('/');
  await page.getByRole('button', { name: '続きから' }).click();
  await page.getByRole('button', { name: '端末を調べる' }).click();
  await expect(page.getByRole('dialog', { name: '端末' })).toBeVisible();
}

const mode = (page: Page, name: string) =>
  page
    .getByRole('dialog', { name: '端末' })
    .getByRole('button', { name, exact: true });

async function capture(page: Page, info: TestInfo, name: string) {
  await expect(page.locator('.toast')).toBeHidden();
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path });
  await info.attach(name, {
    path,
    contentType: 'image/png',
  });
}

async function assertDisplayBounds(page: Page) {
  const measurements = await page
    .locator('.terminal-observation')
    .evaluate((element) => ({
      width: element.clientWidth,
      scrollWidth: element.scrollWidth,
      height: element.clientHeight,
    }));
  expect(measurements.width).toBeGreaterThan(0);
  expect(measurements.height).toBeGreaterThan(60);
  expect(measurements.scrollWidth).toBeLessThanOrEqual(measurements.width + 1);
  for (const label of [
    'SYSTEM',
    'LOG',
    'SIGNAL',
    'SECURITY',
    '赤い送信ボタンを押す',
  ]) {
    await expect(mode(page, label)).toBeInViewport();
    const bounds = await mode(page, label).boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
  }
}

test('physical keys preserve a calibration, exclude hidden drafts from Tab order, and restore focus', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openTerminal(page, 'puzzle_carrier_sync', false);
  const display = page.getByRole('region', { name: '端末表示器', exact: true });
  const channelA = page.getByRole('slider', { name: 'CHANNEL A' });
  await expect(display).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(channelA).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(channelA).toHaveAttribute('aria-valuenow', '-1');
  await mode(page, 'LOG').click();
  await expect(channelA).toHaveCount(0);
  const back = page.getByRole('button', { name: 'BACK / 部屋に戻る' });
  await back.focus();
  await page.keyboard.press('Tab');
  await expect(display).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(mode(page, 'SYSTEM')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(channelA).toHaveAttribute('aria-valuenow', '-1');
  await expect(mode(page, '赤い送信ボタンを押す')).toBeDisabled();
  await assertDisplayBounds(page);
  await capture(page, info, 'carrier-desktop');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: '端末を調べる' }),
  ).toBeFocused();
});

test('comparison and unfinished tracing survive a display switch without exposing the answer', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openTerminal(page, 'puzzle_signal_investigation');
  await expect(page.getByText('--:--:-- / CALIBRATION ERROR')).toBeVisible();
  await mode(page, 'SECURITY').click();
  await expect(page.getByText('ECHO BUFFER RETURN ○')).toHaveCount(0);
  await mode(page, 'LOG').click();
  for (const [receive, source] of [
    ['R1', 'S-B'],
    ['R2', 'S-C'],
    ['R3', 'S-A'],
  ]) {
    await mode(page, `${receive}受信端子`).click();
    await mode(page, `${source}送信端子`).click();
  }
  await expect(page.getByText('+20:00 / OFFSET CONFIRMED')).toBeVisible();
  await mode(page, '通信実線').click();
  await mode(page, 'SECURITY').click();
  await expect(page.getByText('ROUTE / NOT TRACED — 経路未確認')).toBeVisible();
  await mode(page, 'LOG').click();
  await expect(mode(page, '通信実線')).toHaveAttribute('aria-pressed', 'true');
  await expect(mode(page, 'J-2 丸端子')).toBeEnabled();
  await assertDisplayBounds(page);
  await expect(page.locator('.terminal-scan')).toHaveCSS(
    'animation-name',
    'none',
  );
  await capture(page, info, 'comparison-and-trace-desktop');
});

test('completed observations remain available after loading a checkpoint', async ({
  page,
}, info) => {
  await openTerminal(page, 'puzzle_voiceprint_calibration');
  await mode(page, 'LOG').click();
  await expect(page.getByRole('table')).toContainText('S-B / 02:31:04');
  await mode(page, 'SECURITY').click();
  await expect(page.getByText('ECHO BUFFER RETURN ○')).toBeVisible();
  await mode(page, 'SIGNAL').click();
  await expect(
    page.getByRole('list', { name: '復元済みパケット' }),
  ).toContainText(packetTexts[3]!);
  await expect(page.getByText(/E-01 OCCUPANT/)).toHaveCount(0);
  await capture(page, info, 'restored-packets');
});

for (const viewport of [
  { width: 844, height: 390 },
  { width: 568, height: 320 },
]) {
  test(`touch controls remain reachable without sound or motion at ${viewport.width}x${viewport.height}`, async ({
    browser,
  }, info) => {
    const context = await browser.newContext({
      viewport,
      hasTouch: true,
      baseURL: 'http://127.0.0.1:43173',
    });
    const page = await context.newPage();
    try {
      await openTerminal(page, 'puzzle_carrier_sync');
      const wave = page.getByRole('slider', { name: 'CHANNEL A' });
      // A single tap, not a drag, can set the waveform position.
      await wave.tap({
        position: { x: (await wave.boundingBox())!.width * 0.25, y: 12 },
      });
      await expect(wave).toHaveAttribute('aria-valuenow', '-1');
      await mode(page, 'LOG').tap();
      await mode(page, 'SYSTEM').tap();
      await expect(wave).toHaveAttribute('aria-valuenow', '-1');
      await assertDisplayBounds(page);
      await expect(page.locator('.terminal-safety-cover')).toHaveCSS(
        'transition-property',
        'none',
      );
      await capture(page, info, `carrier-touch-${viewport.width}`);
    } finally {
      await context.close();
    }
  });
}

test('transmission remains a guarded physical action with readable conditions on a short screen', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await openTerminal(page, 'transmission_ready');
  const terminal = page.getByRole('dialog', { name: '端末' });
  await expect(terminal).toHaveAttribute('data-transmission-ready', 'true');
  await expect(
    terminal.getByText('READY / 送信可', { exact: true }),
  ).toBeVisible();
  await expect(
    terminal.getByText(/PUZZLES VERIFIED|確認完了：|7 \/ 7/),
  ).toHaveCount(0);
  const display = page.getByRole('region', { name: '端末表示器', exact: true });
  await display.focus();
  await page.keyboard.press('End');
  await expect(
    terminal.getByText('TRANSMIT / INTERLOCK RELEASED'),
  ).toBeInViewport();
  await assertDisplayBounds(page);
  await capture(page, info, 'transmission-ready-touch');
  await mode(page, '赤い送信ボタンを押す').click();
  await expect(terminal).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('echo-room:progress')!).progress
            .checkpointId,
      ),
    )
    .toBe('checkpoint_transmission_started');
});

for (const stage of [
  'puzzle_signal_investigation',
  'puzzle_packet_repair',
] as const) {
  test(`dense ${stage} controls work by touch on a short display`, async ({
    browser,
  }, info) => {
    const context = await browser.newContext({
      viewport: { width: 568, height: 320 },
      hasTouch: true,
      baseURL: 'http://127.0.0.1:43173',
    });
    const page = await context.newPage();
    try {
      await openTerminal(page, stage);
      if (stage === 'puzzle_signal_investigation') {
        await mode(page, 'LOG').tap();
        for (const [receive, source] of [
          ['R1', 'S-B'],
          ['R2', 'S-C'],
          ['R3', 'S-A'],
        ]) {
          await mode(page, `${receive}受信端子`).tap();
          await mode(page, `${source}送信端子`).tap();
        }
        await mode(page, '通信実線').tap();
        await mode(page, 'J-2 丸端子').tap();
        await expect(mode(page, 'ECHO BUFFER RETURN')).toBeEnabled();
      } else {
        await mode(page, 'SIGNAL').tap();
        for (const [fragment, rail] of [
          ['D', 2],
          ['A', 3],
          ['B', 4],
        ] as const) {
          await mode(page, `断片${fragment}を持つ`).tap();
          await mode(page, `レール${rail}へ断片${fragment}を置く`).tap();
        }
        await expect(page.getByText('FRAME RESTORED')).toBeVisible();
        await mode(
          page,
          'ACCEPT FRAME / 復元内容を確認する',
        ).scrollIntoViewIfNeeded();
      }
      await assertDisplayBounds(page);
      const plate = await page.locator('.terminal-nameplate').boundingBox();
      const glass = await page.locator('.terminal-glass').boundingBox();
      expect(plate!.y + plate!.height).toBeLessThanOrEqual(glass!.y);
      await capture(page, info, `dense-touch-${stage}`);
      if (stage === 'puzzle_packet_repair') {
        await mode(page, 'ACCEPT FRAME / 復元内容を確認する').tap();
        await expect
          .poll(() =>
            page.evaluate(
              () =>
                JSON.parse(localStorage.getItem('echo-room:progress')!).progress
                  .checkpointId,
            ),
          )
          .toBe('checkpoint_puzzle_05');
      }
    } finally {
      await context.close();
    }
  });
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 844, height: 390 },
  { width: 568, height: 320 },
]) {
  test(`send configuration survives a failed test and display changes at ${viewport.width}x${viewport.height}`, async ({
    browser,
  }, info) => {
    const context = await browser.newContext({
      viewport,
      hasTouch: true,
      baseURL: 'http://127.0.0.1:43173',
    });
    const page = await context.newPage();
    try {
      await openTerminal(page, 'puzzle_transmission_window');
      const device = page.getByRole('region', {
        name: '送信設定',
        exact: true,
      });
      const redButton = mode(page, '赤い送信ボタンを押す');
      await expect(redButton).toBeDisabled();
      const windows = [
        '返事をする前',
        '電源を調べる前',
        'LOGを開いた直後',
        '最後の操作の前',
      ];
      for (let index = 0; index < 4; index += 1) {
        await device
          .getByRole('button', { name: `送信する文「${packetTexts[index]}」` })
          .tap();
        await device
          .getByRole('button', { name: `W${index + 1} ${windows[index]}` })
          .tap();
      }
      await device.getByRole('button', { name: 'TEST PULSE' }).tap();
      await expect(device.getByText('PACKET MAP / LOCKED')).toBeVisible();
      await expect(device.getByText('DELAY / RECHECK')).toBeVisible();
      await expect(device.getByText('ROUTE / RECHECK')).toBeVisible();
      await expect(redButton).toBeDisabled();
      await device.getByRole('spinbutton', { name: '時間差ダイヤル' }).tap();
      await mode(page, 'LOG').tap();
      await mode(page, 'SYSTEM').tap();
      await expect(
        device.getByRole('button', { name: 'W4 最後の操作の前' }),
      ).toContainText('PACKET-04');
      await expect(
        device.getByRole('spinbutton', { name: '時間差ダイヤル' }),
      ).toContainText('-00:20:00');
      await device.getByRole('spinbutton', { name: '送り先ダイヤル' }).tap();
      await assertDisplayBounds(page);
      await capture(page, info, `send-settings-${viewport.width}`);
      await device.getByRole('button', { name: 'TEST PULSE' }).tap();
      const narrative = page.getByRole('dialog', { name: 'メッセージ' });
      await expect(narrative).toBeVisible();
      await expect(
        page.getByRole('region', { name: '端末表示器' }),
      ).toBeHidden();
      await narrative.getByRole('button', { name: '次の文章へ' }).tap();
      await expect(redButton).toBeEnabled();
      await expect(
        page.getByRole('region', { name: '端末表示器' }),
      ).toBeFocused();
      await assertDisplayBounds(page);
      await capture(page, info, `send-ready-${viewport.width}`);
    } finally {
      await context.close();
    }
  });
}

test('a wrong trace can be reset and retried, and repaired packets can be re-read', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openTerminal(page, 'puzzle_signal_investigation');
  await mode(page, 'LOG').click();
  for (const [receive, source] of [
    ['R1', 'S-B'],
    ['R2', 'S-C'],
    ['R3', 'S-A'],
  ]) {
    await mode(page, `${receive}受信端子`).click();
    await mode(page, `${source}送信端子`).click();
  }
  for (const label of ['電力破線', 'J-3 線端子', 'E-02'])
    await mode(page, label).click();
  await expect(page.locator('.device-feedback')).toHaveClass(/is-error/);
  await mode(page, 'TRACE RESET').click();
  await expect(page.getByText('R1 ─ S-B')).toBeVisible();
  for (const label of ['通信実線', 'J-2 丸端子', 'ECHO BUFFER RETURN'])
    await mode(page, label).click();
  for (let i = 0; i < 3; i += 1)
    await page.getByRole('button', { name: '次の文章へ' }).click();
  await page.getByRole('button', { name: '端末を調べる' }).click();
  await mode(page, 'SIGNAL').click();
  // Fill a broken arrangement first; correction must preserve local input.
  for (const [fragment, rail] of [
    ['A', 2],
    ['D', 3],
    ['B', 4],
  ] as const) {
    await mode(page, `断片${fragment}を持つ`).click();
    await mode(page, `レール${rail}へ断片${fragment}を置く`).click();
  }
  await expect(page.getByText('SIGNAL BREAK')).toBeVisible();
  await assertDisplayBounds(page);
  await capture(page, info, 'packet-broken-desktop');
  await mode(page, 'レール2の断片Aを持ち上げる').click();
  await mode(page, 'レール3の断片Dを持ち上げる').click();
  await mode(page, '断片Dを持つ').click();
  await mode(page, 'レール2へ断片Dを置く').click();
  await expect(page.getByText('FRAME RESTORED')).toBeVisible();
  await expect(page.getByText(/CONTINUITY \/ BROKEN|SIGNAL BREAK/)).toHaveCount(
    0,
  );
  await mode(page, 'LOG').click();
  await expect(page.getByRole('table')).toContainText('S-B / 02:31:04');
  await mode(page, 'SIGNAL').click();
  await expect(page.getByText('FRAME RESTORED')).toBeVisible();
  await capture(page, info, 'packet-restored-desktop');
  await mode(page, 'ACCEPT FRAME / 復元内容を確認する').click();
  for (let i = 0; i < 2; i += 1)
    await page.getByRole('button', { name: '次の文章へ' }).click();
  await page.reload();
  await page.getByRole('button', { name: '続きから' }).click();
  await page.getByRole('button', { name: '端末を調べる' }).click();
  await mode(page, 'SIGNAL').click();
  await expect(
    page.getByRole('list', { name: '復元済みパケット' }),
  ).toContainText(packetTexts[3]!);
});
