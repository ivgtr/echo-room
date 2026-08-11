import { expect, test, type Page } from '@playwright/test';

import { createProgressSave, installProgressSave } from './saveFixture';

test('keyboard-only route solves all ten deductions before transmission', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.addInitScript(
    installProgressSave,
    createProgressSave({ activeElapsedMs: 1_188_000, reservePower: true }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: '続きから' }).press('Enter');

  await openHotspot(page, '壁面端末を調べる');
  await solve(page, [
    ['Aを動かす方向', '右へ2'],
    ['Bを動かす方向', 'そのまま'],
    ['Cを動かす方向', '左へ1'],
  ]);

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await openHotspot(page, 'ロッカーを調べる');
  await solve(page, [
    ['1番目の記号', '二重線 ║'],
    ['2番目の記号', '丸 ○'],
    ['3番目の記号', '三角 △'],
    ['4番目の記号', 'ひし形 ◆'],
  ]);
  await expectSavedCheckpoint(page, 'checkpoint_puzzle_03');
  const acquisition = page.getByRole('dialog', { name: '所持品を入手した' });
  await expect(acquisition.getByText('設備・配線図')).toBeVisible();
  await acquisition
    .getByRole('button', { name: '所持品に追加' })
    .press('Enter');

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await openHotspot(page, '壁面端末を調べる');
  await solve(page, [
    ['R1 と同じ波のSOURCE', 'S-B'],
    ['R2 と同じ波のSOURCE', 'S-C'],
    ['R3 と同じ波のSOURCE', 'S-A'],
  ]);

  await openHotspot(page, '壁面端末を調べる');
  await solve(page, [
    ['たどる線', '実線 / 通信'],
    ['壁の中で通る場所', 'J-2 / 丸端子'],
    ['線のつなぎ先', 'ECHO BUFFER RETURN'],
  ]);

  await openHotspot(page, '壁面端末を調べる');
  await solve(page, [
    ['1番目の断片', '断片C'],
    ['2番目の断片', '断片D'],
    ['3番目の断片', '断片A'],
    ['4番目の断片', '断片B'],
  ]);

  await openHotspot(page, '壁面端末を調べる');
  await solve(page, [
    ['未来のことを知っているPACKET', /PACKET 04/],
    ['そう判断できる理由', 'まだしていない操作を知っている'],
  ]);
  await expectSavedCheckpoint(page, 'checkpoint_puzzle_07');

  await openHotspot(page, '解析パネルを調べる');
  await solve(page, [
    ['波の間隔', '半分にする'],
    ['波の上下', '上下反転'],
    ['波の開始位置', '左へ2'],
  ]);

  await openHotspot(page, '壁面端末を調べる');
  await solve(page, [
    ['1番目の発言', '……聞こえるか？'],
    ['2番目の発言', 'まず電源を戻せ。'],
    ['3番目の発言', 'ログは気にするな。'],
    ['4番目の発言', '最後に、赤いボタンを押せ。'],
  ]);

  await openHotspot(page, '壁面端末を調べる');
  await solve(page, [
    ['受信タイミング W1', '……聞こえるか？'],
    ['受信タイミング W2', 'まず電源を戻せ。'],
    ['受信タイミング W3', 'ログは気にするな。'],
    ['受信タイミング W4', '最後に、赤いボタンを押せ。'],
    ['送る時刻', '-00:20:00'],
    ['送り先', 'ECHO BUFFER RETURN'],
  ]);
  await expectSavedCheckpoint(page, 'checkpoint_puzzle_10');

  await openHotspot(page, '壁面端末を調べる');
  const terminal = page.getByRole('dialog', { name: '壁面端末' });
  await expect(terminal.getByText('確認完了：10 / 10')).toBeVisible();
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
  await page.getByRole('button', { name: 'ドアを開ける' }).press('Enter');
  await expect(page.getByText('TRANSMISSION COMPLETE')).toBeVisible();
  await expectSavedCheckpoint(page, 'checkpoint_completed');
});

async function openHotspot(page: Page, name: string) {
  await page.getByRole('button', { name }).press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function solve(
  page: Page,
  choices: readonly (readonly [string, string | RegExp])[],
) {
  const puzzle = page.locator('[data-puzzle-id]:visible');
  for (const [groupName, optionName] of choices) {
    const group = puzzle.getByRole('group', { name: groupName });
    await group.getByRole('button', { name: optionName }).press('Enter');
  }
  await puzzle
    .getByRole('button', { name: 'この答えで確認する' })
    .press('Enter');
  await expect(puzzle).toBeHidden();
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
