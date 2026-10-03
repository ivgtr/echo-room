import { expect, test, type Page } from '@playwright/test';
import { advanceNarratives, restorePower, startNewGame } from './gameplay';

test('keyboard-only route solves all seven deductions before transmission', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await startNewGame(page);
  await restorePower(page);

  await openHotspot(page, '端末を調べる');
  await solveCarrier(page);

  await turnRight(page, '南側');
  await turnRight(page, '西側');
  await openHotspot(page, 'ロッカーを調べる');
  await solveLocker(page);
  await advanceNarratives(page, 1);
  const acquisition = page.getByRole('dialog', { name: '所持品を入手した' });
  await expect(acquisition.getByText('施設図')).toBeVisible();
  await acquisition
    .getByRole('button', { name: '所持品に追加' })
    .press('Enter');

  await turnRight(page, '北側');
  await turnRight(page, '東側');
  await openHotspot(page, '端末を調べる');
  await page.getByRole('button', { name: 'LOG' }).press('Enter');
  await solveSignalInvestigation(page);

  await openHotspot(page, '端末を調べる');
  await page.getByRole('button', { name: 'SIGNAL' }).press('Enter');
  await solvePacketRail(page);

  await openHotspot(page, '端末横のパネルを調べる');
  await solveVoiceprint(page);

  await openHotspot(page, '端末を調べる');
  await solveTransmissionPatch(page);

  const terminal = page.getByRole('dialog', { name: '端末' });
  await expect(
    terminal.getByText('READY / 送信可', { exact: true }),
  ).toBeVisible();
  await terminal
    .getByRole('button', { name: '赤い送信ボタンを押す' })
    .press('Enter');

  for (let index = 0; index < 7; index += 1) {
    await expect(page.locator('.ending-text')).toHaveAttribute(
      'data-text-complete',
      'true',
      { timeout: 10_000 },
    );
    await page.getByRole('button', { name: '次の文章へ' }).press('Enter');
  }
  await expect(page.locator('.ending-text')).toHaveAttribute(
    'data-text-complete',
    'true',
    { timeout: 10_000 },
  );
  await page.getByRole('button', { name: '通信を終える' }).press('Enter');
  await expect(page.getByText(/ドア解錠/)).toBeVisible();
  await page.getByRole('button', { name: 'ドアを調べる' }).press('Enter');
  await expect(page.getByText('TRANSMISSION COMPLETE')).toBeVisible();
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
}

function puzzle(page: Page) {
  return page.locator('[data-puzzle-id]:visible');
}

async function finishPuzzle(page: Page, narrativeCount: number) {
  const puzzle = page.locator('[data-puzzle-id]:visible');
  await expect(puzzle).toBeHidden();
  await advanceNarratives(page, narrativeCount);
}

async function solveCarrier(page: Page) {
  const device = puzzle(page);
  await device.getByRole('slider', { name: 'CHANNEL A' }).press('ArrowRight');
  await device.getByRole('slider', { name: 'CHANNEL A' }).press('ArrowRight');
  await device.getByRole('slider', { name: 'CHANNEL C' }).press('ArrowLeft');
  await finishPuzzle(page, 1);
}

async function solveLocker(page: Page) {
  const device = puzzle(page);
  await device.getByRole('spinbutton', { name: 'ダイヤル1' }).press('ArrowUp');
  await device
    .getByRole('button', { name: 'ロッカーのハンドル' })
    .press('Enter');
  await expect(
    device.getByRole('spinbutton', { name: 'ダイヤル1' }),
  ).toHaveAttribute('aria-valuenow', '0');
  await expect(device.getByText('LOCK / JAMMED')).toBeVisible();
  for (let index = 2; index <= 4; index += 1)
    await device
      .getByRole('spinbutton', { name: `ダイヤル${index}` })
      .press('ArrowUp');
  await device
    .getByRole('button', { name: 'ロッカーのハンドル' })
    .press('Enter');
  await expect(device).toBeHidden();
}

async function solveSignalInvestigation(page: Page) {
  const device = puzzle(page);
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
  const ruler = device.getByRole('slider', { name: '送信時刻ルーラー' });
  for (let step = 0; step < 4; step += 1) await ruler.press('PageUp');
  await expect(device.getByText('TEMPORAL COHERENCE')).toBeVisible();
  for (const label of ['INTERCOM端子', 'J-1端子', 'J-2端子', 'BUFFER端子'])
    await device.getByRole('button', { name: label }).press('Enter');
  await finishPuzzle(page, 4);
}

async function solvePacketRail(page: Page) {
  const device = puzzle(page);
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
  await expect(
    device.getByText('PACKET 04 / 最後に、赤いボタンを押せ。', { exact: true }),
  ).toBeVisible();
  await device
    .getByRole('button', { name: 'ACCEPT FRAME / 復元内容を確認する' })
    .press('Enter');
  await finishPuzzle(page, 2);
}

async function solveVoiceprint(page: Page) {
  const device = puzzle(page);
  await device
    .getByRole('slider', { name: '波の間隔ダイヤル' })
    .press('ArrowLeft');
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
  const device = puzzle(page);
  const scenes = [
    '受信後の返事',
    '指示に従った結果',
    'この直後に受信',
    '復元した文への反応',
  ];
  const packetLabels = [
    '……聞こえるか？',
    'まず電源を戻せ。',
    'ログは気にするな。',
    '最後に、赤いボタンを押せ。',
  ];
  for (let index = 0; index < 4; index += 1) {
    await device
      .getByRole('button', { name: `送信する文「${packetLabels[index]}」` })
      .press('Enter');
    await device
      .getByRole('button', {
        name: new RegExp(`^${scenes[index]}`),
      })
      .press('Enter');
  }
  await device
    .getByRole('slider', { name: '送信側の時間軸' })
    .press('ArrowLeft');
  await device
    .getByRole('button', { name: '送信ケーブルを持つ' })
    .press('Enter');
  await device
    .getByRole('button', { name: 'ECHO BUFFER RETURNの端子' })
    .press('Enter');
  await device
    .getByRole('button', { name: 'TEST PULSE 試験レバー' })
    .press('Enter');
  await finishPuzzle(page, 1);
}
