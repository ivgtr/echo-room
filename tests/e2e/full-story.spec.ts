import { expect, test } from '@playwright/test';

test('safe checkpoint reaches transmission complete through every remaining puzzle', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'echo-room:progress',
      JSON.stringify({
        schemaVersion: 1,
        contentVersion: '0.1.0',
        savedAt: new Date().toISOString(),
        progress: {
          checkpointId: 'checkpoint_power_restored',
          powerRestored: true,
          locationId: 'location_east_wall',
        },
      }),
    );
  });
  await page.goto('/');
  await page.getByRole('button', { name: '続きから' }).click();
  await page
    .getByLabel('調査対象')
    .getByRole('button', { name: '壁面端末を調べる' })
    .click();
  const terminal = page.getByRole('dialog', { name: '壁面端末' });
  await terminal.getByRole('button', { name: 'LOG' }).click();
  await expect(terminal.getByText('02:37:18')).toBeVisible();
  await terminal.getByRole('button', { name: '20分の差を確認した' }).click();

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page
    .getByLabel('調査対象')
    .getByRole('button', { name: 'ロッカーを調べる' })
    .click();
  const locker = page.getByRole('dialog', { name: '4桁電子錠' });
  await locker.getByLabel('解錠コード').fill('0217');
  await locker.getByRole('button', { name: '入力する' }).click();
  await expect(locker.getByRole('alert')).toBeVisible();
  await locker.getByLabel('解錠コード').fill('0237');
  await locker.getByRole('button', { name: '入力する' }).click();

  await page.getByRole('button', { name: 'SYSTEM' }).click();
  await page
    .getByRole('dialog', { name: 'SYSTEM' })
    .getByRole('button', { name: 'INVENTORY / 所持品' })
    .click();
  const inventory = page.getByRole('dialog', { name: '所持品' });
  await inventory.getByRole('button', { name: '展開して確認' }).click();
  await inventory.getByRole('button', { name: '閉じる' }).click();
  await page.getByRole('button', { name: /右を向く（北壁/ }).click();
  await page.getByRole('button', { name: /右を向く（東壁/ }).click();
  await page
    .getByLabel('調査対象')
    .getByRole('button', { name: '壁面端末を調べる' })
    .click();
  await terminal.getByRole('button', { name: 'SECURITY' }).click();
  await terminal
    .getByRole('button', { name: '職員用カードを使用して図面を確認' })
    .click();
  await terminal.getByRole('button', { name: '字幕付きで再生' }).nth(3).click();

  await page.getByRole('button', { name: '解析パネルを調べる' }).click();
  const analysis = page.getByRole('dialog', { name: '端末横解析パネル' });
  await analysis
    .getByRole('button', { name: 'ドライバーを使用して開く' })
    .click();
  await analysis
    .getByRole('button', { name: 'VOICE ANALYSISをONにする' })
    .click();
  await expect(analysis.getByText('VOICEPRINT MATCH 100%')).toBeVisible();
  await analysis.getByRole('button', { name: '結果を確認する' }).click();

  const finalTerminal = page.getByRole('dialog', { name: '壁面端末' });
  for (const name of [
    '最後に、赤いボタンを押せ。',
    'ログは気にするな。',
    'まず電源を戻せ。',
    '……聞こえるか？',
  ]) {
    await finalTerminal.getByRole('button', { name }).click();
  }
  await finalTerminal.getByRole('button', { name: '4枠を設定' }).click();
  await expect(
    finalTerminal.getByText('順番を確認してください。'),
  ).toBeVisible();
  await finalTerminal.getByRole('button', { name: '並べ直す' }).click();
  for (const name of [
    '……聞こえるか？',
    'まず電源を戻せ。',
    'ログは気にするな。',
    '最後に、赤いボタンを押せ。',
  ]) {
    await finalTerminal.getByRole('button', { name }).click();
  }
  await finalTerminal.getByRole('button', { name: '4枠を設定' }).click();
  await finalTerminal
    .getByRole('button', { name: '赤い送信ボタンを押す' })
    .click();
  for (let index = 0; index < 5; index += 1)
    await page.getByRole('button', { name: '続ける' }).click();
  await page.getByRole('button', { name: 'ドアを開ける' }).click();
  await expect(page.getByText('TRANSMISSION COMPLETE')).toBeVisible();
});
