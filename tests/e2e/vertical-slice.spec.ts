import { expect, test, type Page } from '@playwright/test';

async function enterRoom(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'ゲーム開始' }).click();
  for (let index = 0; index < 6; index += 1) {
    await page.getByRole('button', { name: '次へ' }).click();
  }
  await page.getByRole('button', { name: '探索を始める' }).click();
}

test('keeps one canvas while crossfading all four room views', async ({
  page,
}) => {
  await enterRoom(page);
  const world = page.getByTestId('world-canvas');
  const canvas = world.locator('canvas');
  await expect(world).toHaveAttribute('data-asset-state', 'ready');
  await expect(world).toHaveAttribute('data-transition-state', 'idle');
  await expect(canvas).toHaveCount(1);
  await canvas.evaluate((element) => {
    element.dataset.persistenceMarker = 'original-canvas';
  });
  await world.evaluate((element) => {
    element.dataset.sawTransition = 'false';
    new MutationObserver(() => {
      if (element.dataset.transitionState === 'animating') {
        element.dataset.sawTransition = 'true';
      }
    }).observe(element, {
      attributes: true,
      attributeFilter: ['data-transition-state'],
    });
  });

  for (const [buttonName, viewName] of [
    ['東壁を見る', '東壁'],
    ['南壁を見る', '南壁'],
    ['西壁を見る', '西壁'],
    ['北壁を見る', '北壁'],
  ] as const) {
    await world.evaluate((element) => {
      element.dataset.sawTransition = 'false';
    });
    await page.getByRole('button', { name: buttonName }).click();
    await expect(canvas).toHaveAttribute(
      'aria-label',
      new RegExp(`実験室E-01 ${viewName}`),
    );
    await expect(world).toHaveAttribute('data-asset-state', 'ready');
    await expect(world).toHaveAttribute('data-transition-state', 'idle');
    await expect(world).toHaveAttribute('data-saw-transition', 'true');
    await expect(canvas).toHaveAttribute(
      'data-persistence-marker',
      'original-canvas',
    );
    await expect(page.getByText('背景素材を読み込んでいます…')).toBeHidden();
  }
});

test('keyboard-capable route restores power and resumes after reload', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ゲーム開始' }).click();
  for (let index = 0; index < 6; index += 1)
    await page.getByRole('button', { name: '次へ' }).click();
  await page.getByRole('button', { name: '探索を始める' }).click();
  const world = page.getByTestId('world-canvas');
  const canvas = world.locator('canvas');
  await expect(world).toHaveAttribute('data-asset-state', 'ready');
  await canvas.evaluate((element) => {
    element.dataset.persistenceMarker = 'before-power';
  });
  await page.getByRole('button', { name: '音声 ON' }).click();
  await page.getByRole('button', { name: '西壁を見る' }).click();
  await page
    .getByLabel('調査対象')
    .getByRole('button', { name: 'ブレーカーを調べる' })
    .click();

  await page.getByRole('button', { name: '回路 1' }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByText('接続順が違う。全レバーが戻った。もう一度試せる。'),
  ).toBeVisible();
  await page.getByRole('button', { name: '音高の視覚補助：OFF' }).click();
  for (const name of [
    /回路 3、音高レベル 1/,
    /回路 1、音高レベル 2/,
    /回路 4、音高レベル 3/,
    /回路 2、音高レベル 4/,
  ]) {
    await page.getByRole('button', { name }).focus();
    await page.keyboard.press('Enter');
  }

  await expect(page.getByText('MAIN POWER ONLINE')).toBeVisible();
  await expect(world).toHaveAttribute('data-transition-state', 'idle');
  await expect(canvas).toHaveAttribute(
    'data-persistence-marker',
    'before-power',
  );
  await expect(page.getByText('電源復旧地点を自動保存しました')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '続きから' }).click();
  await expect(page.getByText('MAIN POWER ONLINE')).toBeVisible();
  await expect(
    page.getByText('端末のLOGで受信時刻と送信元時刻を確認しよう。'),
  ).toBeVisible();
});

test.describe('touch input', () => {
  test.use({ hasTouch: true });

  test('touch reaches the same breaker puzzle', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'ゲーム開始' }).tap();
    for (let index = 0; index < 6; index += 1) {
      await page.getByRole('button', { name: '次へ' }).tap();
    }
    await page.getByRole('button', { name: '探索を始める' }).tap();
    await page.getByRole('button', { name: '西壁を見る' }).tap();
    await page
      .getByLabel('調査対象')
      .getByRole('button', { name: 'ブレーカーを調べる' })
      .tap();
    await expect(
      page.getByRole('heading', { name: '非常電源ブレーカー' }),
    ).toBeVisible();
  });
});
