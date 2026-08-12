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

  await turnRight(page, '南壁');
  await turnRight(page, '西壁');
  await expect(page.locator('.world-nameplate')).toHaveCount(0);
  await openHotspot(page, 'ロッカーを調べる');
  await solveLocker(page);
  await expectSavedCheckpoint(page, 'checkpoint_puzzle_03');
  const lockerMessage = page.getByRole('dialog', { name: 'メッセージ' });
  await expect(lockerMessage).toContainText('未確認の通信ログが3件ある');
  const lockerMessageText = await lockerMessage.textContent();
  expect(lockerMessageText).not.toContain('MESSAGE LOG');
  expect(lockerMessageText).not.toContain('E-01 OCCUPANT');
  await expect(
    page.getByRole('dialog', { name: '所持品を入手した' }),
  ).toBeHidden();
  await expect(page.locator('.exploration-controls')).toHaveAttribute(
    'inert',
    '',
  );
  await page.keyboard.press('Escape');
  await expect(lockerMessage).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'SYSTEM' })).toHaveCount(0);
  await advanceNarratives(page, 1);
  const acquisition = page.getByRole('dialog', { name: '所持品を入手した' });
  await expect(acquisition.getByText('設備・配線図')).toBeVisible();
  await acquisition
    .getByRole('button', { name: '所持品に追加' })
    .press('Enter');

  await turnRight(page, '北壁');
  await turnRight(page, '東壁');
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

async function turnRight(page: Page, wall: string) {
  const turn = page.getByRole('button', {
    name: new RegExp(`右を向く（${wall}`),
  });
  await expect(turn).toBeVisible();
  await turn.press('Enter');
  await expect(
    page.getByTestId('world-canvas').locator('canvas'),
  ).toHaveAttribute('aria-label', new RegExp(wall));
}

async function puzzle(page: Page) {
  return page.locator('[data-puzzle-id]:visible');
}

async function finishPuzzle(page: Page, narrativeCount: number) {
  const puzzle = page.locator('[data-puzzle-id]:visible');
  await expect(puzzle).toBeHidden();
  await advanceNarratives(page, narrativeCount);
}

async function solveCarrier(page: Page) {
  const device = await puzzle(page);
  await device.getByRole('slider', { name: 'CHANNEL A' }).press('ArrowRight');
  await device.getByRole('slider', { name: 'CHANNEL A' }).press('ArrowRight');
  await device.getByRole('slider', { name: 'CHANNEL C' }).press('ArrowLeft');
  await finishPuzzle(page, 1);
}

async function solveLocker(page: Page) {
  const device = await puzzle(page);
  await device.getByRole('spinbutton', { name: 'ダイヤル1' }).press('ArrowUp');
  await device.getByRole('button', { name: 'LOCK HANDLE' }).press('Enter');
  await expect(
    device.getByRole('spinbutton', { name: 'ダイヤル1' }),
  ).toHaveAttribute('aria-valuenow', '0');
  await expect(device.getByText('LOCK / JAMMED')).toBeVisible();
  for (let index = 2; index <= 4; index += 1)
    await device
      .getByRole('spinbutton', { name: `ダイヤル${index}` })
      .press('ArrowUp');
  await device.getByRole('button', { name: 'LOCK HANDLE' }).press('Enter');
  await expect(device).toBeHidden();
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
  await finishPuzzle(page, 3);
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
  await expect(device.getByText('FRAME RESTORED')).toBeVisible();
  await expect(device.getByText(/PACKET 04/)).toContainText(
    '最後に、赤いボタンを押せ。',
  );
  await device
    .getByRole('button', { name: 'ACCEPT FRAME / 復元内容を確認する' })
    .press('Enter');
  await finishPuzzle(page, 2);
}

async function solveVoiceprint(page: Page) {
  const device = await puzzle(page);
  await device
    .getByRole('spinbutton', { name: '波の間隔ダイヤル' })
    .press('Enter');
  await device.getByRole('switch').press('Enter');
  await device.getByRole('slider', { name: '波の開始位置' }).press('ArrowLeft');
  await device.getByRole('slider', { name: '波の開始位置' }).press('ArrowLeft');
  await expect(device.getByText('100.0% / MATCH / E-01 OCCUPANT')).toBeVisible({
    timeout: 10_000,
  });
  await device
    .getByRole('button', { name: 'MATCH CONFIRM / 本人一致を確認する' })
    .press('Enter');
  await finishPuzzle(page, 3);
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
  await device.getByRole('button', { name: 'TEST PULSE' }).press('Enter');
  await expect(device.getByText('PACKET MAP / LOCKED')).toBeVisible();
  await expect(device.getByText('DELAY / RECHECK')).toBeVisible();
  await expect(device.getByText('ROUTE / RECHECK')).toBeVisible();
  await device
    .getByRole('spinbutton', { name: '送信遅延ダイヤル' })
    .press('Enter');
  await device
    .getByRole('spinbutton', { name: '送信終端ダイヤル' })
    .press('Enter');
  await expect(device.getByText('DELAY / LOCKED')).toBeVisible();
  await expect(device.getByText('ROUTE / LOCKED')).toBeVisible();
  await device.getByRole('button', { name: 'TEST PULSE' }).press('Enter');
  await finishPuzzle(page, 1);
}

async function advanceNarratives(page: Page, count: number) {
  const message = page.locator('.narrative-panel:visible');
  for (let index = 0; index < count; index += 1) {
    await expect(message).toBeVisible();
    const currentText = await message.textContent();
    await expect(message.locator('.narrative-text')).toHaveAttribute(
      'data-text-complete',
      'true',
      { timeout: 10_000 },
    );
    await message.getByRole('button', { name: '続ける' }).press('Enter');
    if (index < count - 1)
      await expect.poll(() => message.textContent()).not.toBe(currentText);
  }
  await expect(message).toBeHidden({ timeout: 10_000 });
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
