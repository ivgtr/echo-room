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
    ['CHANNEL A 補正', '右へ2'],
    ['CHANNEL B 補正', '補正なし'],
    ['CHANNEL C 補正', '左へ1'],
  ]);

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await openHotspot(page, 'ロッカーを調べる');
  await solve(page, [
    ['記号枠 1', '二重線 ║'],
    ['記号枠 2', '環 ○'],
    ['記号枠 3', '三角 △'],
    ['記号枠 4', '節点 ◆'],
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
    ['R1 に対応するSOURCE', 'S-B'],
    ['R2 に対応するSOURCE', 'S-C'],
    ['R3 に対応するSOURCE', 'S-A'],
  ]);

  await openHotspot(page, '壁面端末を調べる');
  await solve(page, [
    ['追跡する配線層', '実線 / 通信'],
    ['設備壁内の中継点', 'J-2 / 環端子'],
    ['回線の終端', 'ECHO BUFFER RETURN'],
  ]);

  await openHotspot(page, '壁面端末を調べる');
  await solve(page, [
    ['復元位置 1', '断片C'],
    ['復元位置 2', '断片D'],
    ['復元位置 3', '断片A'],
    ['復元位置 4', '断片B'],
  ]);

  await openHotspot(page, '壁面端末を調べる');
  await solve(page, [
    ['現在より後の出来事を前提にするPACKET', /PACKET 04/],
    ['矛盾を成立させる根拠', '未発生の操作を知っている'],
  ]);
  await expectSavedCheckpoint(page, 'checkpoint_puzzle_07');

  await openHotspot(page, '解析パネルを調べる');
  await solve(page, [
    ['間隔チャンネルの補正', '1/2へ圧縮'],
    ['包絡チャンネルの補正', '上下反転'],
    ['位相チャンネルの補正', '左へ2'],
  ]);

  await openHotspot(page, '壁面端末を調べる');
  await solve(page, [
    ['会話位置 1', '……聞こえるか？'],
    ['会話位置 2', 'まず電源を戻せ。'],
    ['会話位置 3', 'ログは気にするな。'],
    ['会話位置 4', '最後に、赤いボタンを押せ。'],
  ]);

  await openHotspot(page, '壁面端末を調べる');
  await solve(page, [
    ['受信窓 W1', '……聞こえるか？'],
    ['受信窓 W2', 'まず電源を戻せ。'],
    ['受信窓 W3', 'ログは気にするな。'],
    ['受信窓 W4', '最後に、赤いボタンを押せ。'],
    ['共通送信遅延', '-00:20:00'],
    ['送信回線', 'ECHO BUFFER RETURN'],
  ]);
  await expectSavedCheckpoint(page, 'checkpoint_puzzle_10');

  await openHotspot(page, '壁面端末を調べる');
  const terminal = page.getByRole('dialog', { name: '壁面端末' });
  await expect(terminal.getByText(/PUZZLES VERIFIED: 10 \/ 10/)).toBeVisible();
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
  await puzzle.getByRole('button', { name: '構成を検証する' }).press('Enter');
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
