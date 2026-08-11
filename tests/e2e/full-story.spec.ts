import { expect, test } from '@playwright/test';

test.use({ hasTouch: true });

test('safe checkpoint reaches transmission complete through every remaining puzzle', async ({
  page,
}) => {
  test.setTimeout(120_000);
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
          activeElapsedMs: 1_188_000,
          reservePower: true,
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
  await expect(
    terminal.getByText('緊急時は「送信側の時刻」を使用する。'),
  ).toBeVisible();
  await terminal.getByRole('button', { name: 'LOG' }).click();
  await expect(terminal.getByText('02:37:18')).toBeVisible();
  await terminal.getByRole('button', { name: '20分の差を確認した' }).click();
  await expect(
    page.getByRole('button', { name: '壁面端末を調べる' }),
  ).toBeFocused();

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
  const acquisition = page.getByRole('dialog', {
    name: '所持品を入手した',
  });
  await expect(acquisition.getByText('職員用カード')).toBeVisible();
  await expect(
    acquisition.getByRole('button', { name: '所持品に追加' }),
  ).toBeFocused();
  await acquisition.getByRole('button', { name: '所持品に追加' }).tap();

  await page.getByRole('button', { name: 'SYSTEM' }).click();
  await page
    .getByRole('dialog', { name: 'SYSTEM' })
    .getByRole('button', { name: 'INVENTORY / 所持品' })
    .click();
  const inventory = page.getByRole('dialog', { name: '所持品' });
  await inventory
    .getByRole('button', { name: /ACCESS CARD 職員用カード/ })
    .click();
  await expect(
    inventory.getByLabel('施設E-01 職員用アクセスカード'),
  ).toBeVisible();
  const floorMap = inventory.getByRole('button', {
    name: /FACILITY MAP 簡易フロア図/,
  });
  await floorMap.focus();
  await page.keyboard.press('Enter');
  await inventory.getByRole('button', { name: 'フロア図を展開する' }).click();
  await expect(
    inventory.getByText(
      'E-01の左右は機械設備とコンクリート壁。隣室は存在しない。',
    ),
  ).toBeVisible();
  await inventory.getByRole('button', { name: '所持品を閉じる' }).click();
  await page.getByRole('button', { name: /右を向く（北壁/ }).click();
  await page.getByRole('button', { name: /右を向く（東壁/ }).click();
  await page
    .getByLabel('調査対象')
    .getByRole('button', { name: '壁面端末を調べる' })
    .click();
  await terminal.getByRole('button', { name: 'SECURITY' }).click();
  await terminal
    .getByRole('button', {
      name: /ACCESS CARD 職員用カードを選択して図面を確認/,
    })
    .click();
  await terminal.getByRole('button', { name: '字幕付きで再生' }).nth(3).click();

  await page.getByRole('button', { name: 'SYSTEM' }).click();
  const system = page.getByRole('dialog', { name: 'SYSTEM' });
  await system
    .getByRole('button', { name: 'ARCHIVE / 会話履歴・資料再読' })
    .click();
  await expect(system.getByText('隣の部屋なんてないぞ。')).toBeVisible();
  await expect(system.getByText('最後に、赤いボタンを押せ。')).toBeVisible();
  await system.getByRole('button', { name: 'RESUME / ゲームへ戻る' }).click();

  await page.getByRole('button', { name: '解析パネルを調べる' }).click();
  const analysis = page.getByRole('dialog', { name: '端末横解析パネル' });
  await analysis
    .getByRole('button', { name: /DRIVER ドライバーを選択/ })
    .click();
  await analysis
    .getByRole('button', { name: 'VOICE ANALYSISをONにする' })
    .click();
  await expect(analysis.getByText('VOICEPRINT MATCH 100%')).toBeVisible();
  await expect(
    analysis.getByRole('img', {
      name: 'E-01 OCCUPANTとして照合された職員証写真',
    }),
  ).toHaveAttribute(
    'src',
    '/assets/images/items/gfx-item-003__approved__voice-analysis-crop__512x640.webp',
  );
  await analysis.getByRole('button', { name: '結果を確認する' }).click();

  const finalTerminal = page.getByRole('dialog', { name: '壁面端末' });
  await expect(
    finalTerminal.getByText('TRANSMISSION DESTINATION'),
  ).toBeVisible();
  await expect(
    finalTerminal.getByText('-00:20:00', { exact: true }),
  ).toBeVisible();
  await expect(
    finalTerminal
      .getByRole('list', { name: '送信パケット4枠' })
      .getByRole('listitem'),
  ).toHaveCount(4);
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
