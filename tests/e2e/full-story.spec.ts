import { expect, test, type Page } from '@playwright/test';

import { createProgressSave, installProgressSave } from './saveFixture';

test('keyboard-only route solves all seven deductions before transmission', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await page.addInitScript(
    installProgressSave,
    createProgressSave({ activeElapsedMs: 1_188_000, reservePower: true }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: '続きから' }).press('Enter');

  await openHotspot(page, '壁面端末を調べる');
  await solveCarrier(page);

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await openHotspot(page, 'ロッカーを調べる');
  await solveLocker(page);
  await expectSavedCheckpoint(page, 'checkpoint_puzzle_03');
  const acquisition = page.getByRole('dialog', { name: '所持品を入手した' });
  await expect(acquisition.getByText('設備・配線図')).toBeVisible();
  await acquisition
    .getByRole('button', { name: '所持品に追加' })
    .press('Enter');

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await openHotspot(page, '壁面端末を調べる');
  await page.getByRole('button', { name: 'LOG' }).press('Enter');
  await solveSignalInvestigation(page);

  await openHotspot(page, '壁面端末を調べる');
  await page.getByRole('button', { name: 'SIGNAL' }).press('Enter');
  await solvePacketRail(page);

  await expectSavedCheckpoint(page, 'checkpoint_puzzle_05');

  await openHotspot(page, '解析パネルを調べる');
  await solveVoiceprint(page);

  await openHotspot(page, '壁面端末を調べる');
  await solveTransmissionPatch(page);
  await expectSavedCheckpoint(page, 'checkpoint_puzzle_07');

  const terminal = page.getByRole('dialog', { name: '壁面端末' });
  await expect(terminal.getByText('確認完了：7 / 7')).toBeVisible();
  await terminal
    .getByRole('button', { name: '赤い送信ボタンを押す' })
    .press('Enter');
  await expectSavedCheckpoint(page, 'checkpoint_transmission_started');

  for (let index = 0; index < 5; index += 1) {
    await expect(page.locator('.ending-text')).toHaveAttribute(
      'data-text-complete',
      'true',
      { timeout: 10_000 },
    );
    await page.getByRole('button', { name: '続ける' }).press('Enter');
  }
  await expect(page.locator('.ending-text')).toHaveAttribute(
    'data-text-complete',
    'true',
    { timeout: 10_000 },
  );
  await page.getByRole('button', { name: '通信を終える' }).press('Enter');
  await expect(page.getByText(/DOOR UNLOCKED/)).toBeVisible();
  await page.getByRole('button', { name: '鉄製ドアを調べる' }).press('Enter');
  await expect(page.getByText('TRANSMISSION COMPLETE')).toBeVisible();
  await expectSavedCheckpoint(page, 'checkpoint_completed');
});

async function openHotspot(page: Page, name: string) {
  await page.getByRole('button', { name }).press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function puzzle(page: Page) {
  return page.locator('[data-puzzle-id]:visible');
}

async function finishAutomaticPuzzle(page: Page) {
  const puzzle = page.locator('[data-puzzle-id]:visible');
  await expect(puzzle).toBeHidden();
  await dismissEventNarrative(page);
}

async function solveCarrier(page: Page) {
  const device = await puzzle(page);
  await device.getByRole('slider', { name: 'CHANNEL A' }).press('ArrowRight');
  await device.getByRole('slider', { name: 'CHANNEL A' }).press('ArrowRight');
  await device.getByRole('slider', { name: 'CHANNEL C' }).press('ArrowLeft');
  await finishAutomaticPuzzle(page);
}

async function solveLocker(page: Page) {
  const device = await puzzle(page);
  await device.getByRole('spinbutton', { name: 'ダイヤル1' }).press('ArrowUp');
  await device.getByRole('button', { name: 'LOCK HANDLE' }).press('Enter');
  await expect(
    device.getByRole('spinbutton', { name: 'ダイヤル1' }),
  ).toHaveAttribute('aria-valuenow', '1');
  await expect(device.getByText('LOCK / JAMMED')).toBeVisible();
  for (let index = 2; index <= 4; index += 1)
    await device
      .getByRole('spinbutton', { name: `ダイヤル${index}` })
      .press('ArrowUp');
  await device.getByRole('button', { name: 'LOCK HANDLE' }).press('Enter');
  await finishAutomaticPuzzle(page);
}

async function solveSignalInvestigation(page: Page) {
  const device = await puzzle(page);
  for (const [receive, source] of [
    ['R1', 'S-B'],
    ['R2', 'S-C'],
    ['R3', 'S-A'],
  ] as const) {
    await device
      .getByRole('button', { name: `${receive}受信端子` })
      .press('Enter');
    await device
      .getByRole('button', { name: `${source}送信端子` })
      .press('Enter');
  }
  await device.getByRole('button', { name: '通信実線' }).press('Enter');
  await device.getByRole('button', { name: 'J-2 丸端子' }).press('Enter');
  await device
    .getByRole('button', { name: 'ECHO BUFFER RETURN' })
    .press('Enter');
  await finishAutomaticPuzzle(page);
}

async function solvePacketRail(page: Page) {
  const device = await puzzle(page);
  for (const [fragment, rail] of [
    ['D', 2],
    ['A', 3],
    ['B', 4],
  ] as const) {
    await device
      .getByRole('button', { name: `断片${fragment}を持つ` })
      .press('Enter');
    await device
      .getByRole('button', {
        name: `レール${rail}へ断片${fragment}を置く`,
      })
      .press('Enter');
  }
  await finishAutomaticPuzzle(page);
}

async function solveVoiceprint(page: Page) {
  const device = await puzzle(page);
  await device
    .getByRole('spinbutton', { name: '波の間隔ダイヤル' })
    .press('Enter');
  await device.getByRole('switch').press('Enter');
  await device.getByRole('slider', { name: '波の開始位置' }).press('ArrowLeft');
  await device.getByRole('slider', { name: '波の開始位置' }).press('ArrowLeft');
  await expect(device.getByText('99.8%')).toBeVisible({ timeout: 10_000 });
  await finishAutomaticPuzzle(page);
}

async function solveTransmissionPatch(page: Page) {
  const device = await puzzle(page);
  const windows = [
    '返事をする前',
    '電源を調べる前',
    'LOGを開いた直後',
    '最後の操作の前',
  ];
  const packetLabels = [
    '……聞こえるか？',
    'まず電源を戻せ。',
    'ログは気にするな。',
    '最後に、赤いボタンを押せ。',
  ];
  for (let index = 0; index < 4; index += 1) {
    await device
      .getByRole('button', { name: `送信断片「${packetLabels[index]}」` })
      .press('Enter');
    await device
      .getByRole('button', {
        name: new RegExp(`W${index + 1} ${windows[index]}`),
      })
      .press('Enter');
  }
  await device
    .getByRole('spinbutton', { name: '送信遅延ダイヤル' })
    .press('Enter');
  await device
    .getByRole('spinbutton', { name: '送信終端ダイヤル' })
    .press('Enter');
  await device.getByRole('button', { name: 'TEST PULSE' }).press('Enter');
  await finishAutomaticPuzzle(page);
}

async function dismissEventNarrative(page: Page) {
  const narrative = page.locator('.narrative-panel:visible');
  const cue = page.locator('.narrative-cue:visible');
  for (let index = 0; index < 8; index += 1) {
    if ((await cue.count()) > 0) {
      await page.keyboard.press('Escape');
      continue;
    }
    if ((await narrative.count()) === 0) break;
    await expect(narrative.locator('.narrative-text')).toHaveAttribute(
      'data-text-complete',
      'true',
      { timeout: 10_000 },
    );
    await narrative.getByRole('button', { name: '続ける' }).press('Enter');
  }
}

async function expectSavedCheckpoint(page: Page, checkpointId: string) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem('echo-room:progress');
        if (!raw) return null;
        return (JSON.parse(raw) as { progress?: { checkpointId?: string } })
          .progress?.checkpointId;
      }),
    )
    .toBe(checkpointId);
}
