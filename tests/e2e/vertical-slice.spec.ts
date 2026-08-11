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
    [/右を向く（東壁/, '東壁'],
    [/右を向く（南壁/, '南壁'],
    [/右を向く（西壁/, '西壁'],
    [/右を向く（北壁/, '北壁'],
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
  const doorHotspot = page.getByRole('button', {
    name: '鉄製ドアを調べる',
  });
  await doorHotspot.focus();
  await page.keyboard.press('Escape');
  const system = page.getByRole('dialog', { name: 'SYSTEM' });
  await expect(system).toBeVisible();
  await expect(
    system.getByText('非常電源を復旧する。室内を観察し、電源設備を探す。'),
  ).toBeVisible();
  const audioSetting = system.getByRole('button', { name: /AUDIO \/ 音声 ON/ });
  await expect(audioSetting).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(
    system.getByRole('button', { name: 'RETURN TO TITLE / タイトルへ戻る' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(audioSetting).toBeFocused();
  await audioSetting.click();
  await page.keyboard.press('Escape');
  await expect(doorHotspot).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page
    .getByLabel('調査対象')
    .getByRole('button', { name: 'ブレーカーパネルを調べる' })
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
  ).toBeHidden();
  await page.getByRole('button', { name: 'SYSTEM' }).click();
  await expect(
    page
      .getByRole('dialog', { name: 'SYSTEM' })
      .getByText('端末のLOGで受信時刻と送信元時刻を確認しよう。'),
  ).toBeVisible();
});

test('normal exploration exposes only edge turns and direct hotspots', async ({
  page,
}) => {
  await enterRoom(page);
  await expect(page.getByRole('navigation', { name: '見る方向' })).toHaveCount(
    0,
  );
  await expect(page.getByText(/現在目的：/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'タイトルへ' })).toHaveCount(0);
  await expect(page.getByLabel('調査対象')).toBeVisible();
  await expect(
    page.getByRole('button', { name: '鉄製ドアを調べる' }),
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
    await page.getByTestId('world-canvas').dispatchEvent('pointerdown', {
      pointerId: 1,
      clientX: 700,
      clientY: 300,
    });
    await page.getByTestId('world-canvas').dispatchEvent('pointerup', {
      pointerId: 1,
      clientX: 900,
      clientY: 305,
    });
    await expect(
      page.getByTestId('world-canvas').locator('canvas'),
    ).toHaveAttribute('aria-label', /西壁/);
    await page
      .getByLabel('調査対象')
      .getByRole('button', { name: 'ブレーカーパネルを調べる' })
      .tap();
    await expect(
      page.getByRole('heading', { name: '非常電源ブレーカー' }),
    ).toBeVisible();
  });
});
