import { expect, test, type Page } from '@playwright/test';

import {
  createProgressSave,
  createSettingsSave,
  installProgressSave,
  installSettingsSave,
} from './saveFixture';

async function enterRoom(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'ゲーム開始' }).click();
  for (let index = 0; index < 6; index += 1) {
    await expect(page.locator('.narrative-text')).toHaveAttribute(
      'data-text-complete',
      'true',
    );
    await page.getByRole('button', { name: '次へ' }).click();
  }
  await expect(page.locator('.narrative-text')).toHaveAttribute(
    'data-text-complete',
    'true',
  );
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
  await page.getByRole('button', { name: 'ゲーム開始' }).press('Enter');
  await expect(
    page.getByRole('button', { name: '既読会話をスキップ' }),
  ).toHaveCount(0);
  for (let index = 0; index < 6; index += 1) {
    await expect(page.locator('.narrative-text')).toHaveAttribute(
      'data-text-complete',
      'true',
    );
    await page.getByRole('button', { name: '次へ' }).press('Enter');
  }
  await expect(page.locator('.narrative-text')).toHaveAttribute(
    'data-text-complete',
    'true',
  );
  await page.getByRole('button', { name: '探索を始める' }).press('Enter');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('echo-room:settings') ?? '{}')
            .introSeen,
      ),
    )
    .toBe(true);
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
  await expect(page.locator('.exploration-controls')).toHaveAttribute(
    'inert',
    '',
  );
  await expect(page.locator('.exploration-controls')).toHaveAttribute(
    'aria-hidden',
    'true',
  );
  await expect(
    system.getByText('デスクで容量と壊れた線を調べ、ブレーカーをつなぐ。'),
  ).toBeVisible();
  const archiveEntry = system.getByRole('button', {
    name: 'ARCHIVE / 会話履歴・資料再読',
  });
  await expect(archiveEntry).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(
    system.getByRole('button', { name: 'RETURN TO TITLE / タイトルへ戻る' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(archiveEntry).toBeFocused();
  await system
    .getByRole('button', {
      name: 'TEXT & SOUND / 字幕・サウンド設定',
    })
    .press('Enter');
  await expect(
    system.getByRole('button', { name: '小', exact: true }),
  ).toBeFocused();
  await system
    .getByRole('button', { name: /MASTER \/ サウンド ON/ })
    .press('Enter');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(doorHotspot).toBeFocused();
  await expect(page.locator('.exploration-controls')).not.toHaveAttribute(
    'inert',
    '',
  );
  await page.keyboard.press('ArrowLeft');
  await page
    .getByLabel('調査対象')
    .getByRole('button', { name: 'ブレーカーパネルを調べる' })
    .press('Enter');

  const powerPuzzle = page.locator(
    '[data-puzzle-id="puzzle_power_route"]:visible',
  );
  for (const [groupName, optionName] of [
    ['切り離す線', 'TERMINAL / 2 UNIT'],
    ['最初に起動', 'TERMINAL'],
    ['次に起動', 'INTERCOM'],
    ['最後に起動', 'ECHO BUFFER'],
  ] as const) {
    await powerPuzzle
      .getByRole('group', { name: groupName })
      .getByRole('button', { name: optionName })
      .press('Enter');
  }
  await powerPuzzle
    .getByRole('button', { name: 'この答えで確認する' })
    .press('Enter');
  await expect(
    page.getByText(
      '電源が止まった。合計容量、ドアの線、起動する順番を見直そう。',
    ),
  ).toBeVisible();
  await powerPuzzle
    .getByRole('group', { name: '切り離す線' })
    .getByRole('button', { name: /DOOR \/ 4 UNIT/ })
    .press('Enter');
  await powerPuzzle
    .getByRole('button', { name: 'この答えで確認する' })
    .press('Enter');

  await expect(page.getByText('MAIN POWER ONLINE')).toBeVisible();
  await expect(world).toHaveAttribute('data-transition-state', 'idle');
  await expect(canvas).toHaveAttribute(
    'data-persistence-marker',
    'before-power',
  );
  const saveToast = page.getByText('自動保存しました');
  await expect(saveToast).toBeVisible();
  await page.getByRole('button', { name: '壁面端末を調べる' }).press('Enter');
  const terminal = page.getByRole('dialog', { name: '壁面端末' });
  await expect(terminal.getByText('波のずれを直す')).toBeVisible();
  await expect(saveToast).toBeHidden({ timeout: 5000 });
  await terminal.getByRole('button', { name: '端末を閉じる' }).press('Enter');
  await page.reload();
  await page.getByRole('button', { name: '続きから' }).press('Enter');
  await expect(page.getByText('MAIN POWER ONLINE')).toBeVisible();
  await expect(saveToast).toHaveCount(0);
  await expect(
    page.getByText('端末のSYSTEMで、A・B・Cの波のずれを直す。'),
  ).toBeHidden();
  await page.getByRole('button', { name: 'SYSTEM' }).press('Enter');
  await expect(
    page
      .getByRole('dialog', { name: 'SYSTEM' })
      .getByText('端末のSYSTEMで、A・B・Cの波のずれを直す。'),
  ).toBeVisible();
});

test('read introduction can be skipped without losing its archive', async ({
  page,
}) => {
  await page.addInitScript(
    installSettingsSave,
    createSettingsSave({ introSeen: true }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'ゲーム開始' }).press('Enter');
  await page.getByRole('button', { name: '既読会話をスキップ' }).press('Enter');
  await expect(page.getByTestId('world-canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'SYSTEM' })).toBeFocused();
  await page.getByRole('button', { name: 'SYSTEM' }).press('Enter');
  const system = page.getByRole('dialog', { name: 'SYSTEM' });
  await system
    .getByRole('button', { name: 'ARCHIVE / 会話履歴・資料再読' })
    .press('Enter');
  await expect(system.getByText('……聞こえるか？')).toBeVisible();
  await expect(system.getByText('まず電源を戻せ。')).toBeVisible();
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
  await expect(
    page.getByRole('button', { name: '鉄製ドアを調べる' }),
  ).not.toHaveCSS('clip-path', 'none');
  await page.setViewportSize({ width: 304, height: 296 });
  const intercom = page.getByRole('button', {
    name: 'インターホンを調べる',
  });
  await intercom.focus();
  const intercomLabel = intercom.locator('..').locator('.hotspot-label');
  await expect(intercomLabel).toBeVisible();
  const stageBox = await page.locator('.logical-stage').boundingBox();
  const intercomBox = await intercom.boundingBox();
  const intercomLabelBox = await intercomLabel.boundingBox();
  expect(stageBox).not.toBeNull();
  expect(intercomBox).not.toBeNull();
  expect(intercomLabelBox).not.toBeNull();
  expect(intercomLabelBox!.width).toBeGreaterThan(intercomBox!.width);
  expect(intercomLabelBox!.x).toBeGreaterThanOrEqual(stageBox!.x);
  expect(intercomLabelBox!.x + intercomLabelBox!.width).toBeLessThanOrEqual(
    stageBox!.x + stageBox!.width,
  );
  await page.clock.install();
  await intercom.dispatchEvent('click');
  const transitionMetrics = await page
    .locator('.inspection-transition-target')
    .evaluate((target) => {
      const marker = target.querySelector('.inspection-transition-marker');
      const label = target.querySelector('.inspection-transition-label');
      if (!(marker instanceof HTMLElement) || !(label instanceof HTMLElement))
        return null;
      const markerBox = marker.getBoundingClientRect();
      const labelBox = label.getBoundingClientRect();
      return {
        markerWidth: markerBox.width,
        labelWidth: labelBox.width,
        labelLeft: labelBox.left,
        labelRight: labelBox.right,
      };
    });
  expect(transitionMetrics).not.toBeNull();
  expect(transitionMetrics!.labelWidth).toBeGreaterThan(
    transitionMetrics!.markerWidth,
  );
  expect(transitionMetrics!.labelLeft).toBeGreaterThanOrEqual(stageBox!.x);
  expect(transitionMetrics!.labelRight).toBeLessThanOrEqual(
    stageBox!.x + stageBox!.width,
  );
  await page.clock.fastForward(380);
  const closeNarrative = page.getByRole('button', { name: '閉じる' });
  await closeNarrative.click();
  await expect(page.locator('.narrative-text')).toHaveAttribute(
    'data-text-complete',
    'true',
  );
  await closeNarrative.click();
  const doorBox = await page
    .getByRole('button', { name: '鉄製ドアを調べる' })
    .boundingBox();
  expect(doorBox).not.toBeNull();
  await page.mouse.click(doorBox!.x + 2, doorBox!.y + 2);
  await expect(page.locator('.logical-stage')).toHaveAttribute(
    'data-inspection-phase',
    'idle',
  );
});

test('inspection approach locks duplicate input and restores hotspot focus', async ({
  page,
}) => {
  await page.addInitScript(installProgressSave, createProgressSave());
  await page.goto('/');
  await page.getByRole('button', { name: '続きから' }).click();
  const stage = page.locator('.logical-stage');
  const terminalHotspot = page.getByRole('button', {
    name: '壁面端末を調べる',
  });
  await terminalHotspot.evaluate((element) => {
    if (element instanceof HTMLElement) {
      element.click();
      element.click();
    }
  });
  await expect(stage).toHaveAttribute('data-inspection-phase', 'approaching');
  await expect(page.locator('.inspection-transition-marker')).toBeVisible();
  const terminal = page.getByRole('dialog', { name: '壁面端末' });
  await expect(terminal).toHaveCount(1);
  await expect(stage).toHaveAttribute('data-inspection-phase', 'active');
  const worldCanvas = page.getByTestId('world-canvas').locator('canvas');
  await expect(worldCanvas).toHaveAttribute('aria-label', /東壁/);
  await page.keyboard.press('ArrowRight');
  await expect(worldCanvas).toHaveAttribute('aria-label', /東壁/);
  const firstControl = terminal.getByRole('button', { name: 'SYSTEM' });
  await expect(firstControl).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(
    terminal.getByRole('button', { name: '端末を閉じる' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(firstControl).toBeFocused();
  await terminal.getByRole('button', { name: '端末を閉じる' }).click();
  await expect(terminalHotspot).toBeFocused();
  await expect(stage).toHaveAttribute('data-inspection-phase', 'idle');
});

test('reduced motion uses a crossfade and hotspot alignment survives resize', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enterRoom(page);
  await page.setViewportSize({ width: 1000, height: 700 });
  const stage = page.locator('.logical-stage');
  const world = page.getByTestId('world-canvas');
  const door = page.getByRole('button', { name: '鉄製ドアを調べる' });
  await expect(door).toBeVisible();
  const stageBox = await stage.boundingBox();
  const doorBox = await door.boundingBox();
  expect(stageBox).not.toBeNull();
  expect(doorBox).not.toBeNull();
  expect((doorBox!.x - stageBox!.x) / stageBox!.width).toBeCloseTo(
    686 / 1920,
    2,
  );
  expect((doorBox!.y - stageBox!.y) / stageBox!.height).toBeCloseTo(
    206 / 1080,
    2,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.setViewportSize({ width: 844, height: 390 });
  await door.dispatchEvent('click');
  await expect(stage).toHaveAttribute('data-inspection-phase', 'approaching');
  await expect(world).toHaveCSS('transform', 'none');
  await expect(
    page.getByText('非常ロックがかかっている。通信が終わるまで開かない。'),
  ).toBeVisible();
});

test('system archive and subtitle/sound settings preserve the exploration view', async ({
  page,
}) => {
  await page.addInitScript(installProgressSave, createProgressSave());
  await page.goto('/');
  await page.getByRole('button', { name: '続きから' }).click();
  const stage = page.locator('.logical-stage');
  await page.getByRole('button', { name: 'SYSTEM' }).click();
  const system = page.getByRole('dialog', { name: 'SYSTEM' });
  await system
    .getByRole('button', { name: 'ARCHIVE / 会話履歴・資料再読' })
    .click();
  await expect(system.getByText('……聞こえるか？')).toBeVisible();
  await expect(system.getByText('EMERGENCY BYPASS PLAN')).toBeVisible();
  await system.getByRole('button', { name: 'BACK / SYSTEMへ戻る' }).click();
  await system
    .getByRole('button', {
      name: 'TEXT & SOUND / 字幕・サウンド設定',
    })
    .click();
  await system.getByRole('button', { name: '大', exact: true }).click();
  await system.getByRole('button', { name: '高コントラスト' }).click();
  await system.getByRole('button', { name: '速い' }).click();
  await system.getByLabel(/EFFECTS \/ 効果音/).fill('35');
  await system.getByRole('button', { name: /MASTER \/ サウンド ON/ }).click();
  await expect(
    system.getByRole('button', { name: /MASTER \/ サウンド OFF/ }),
  ).toBeVisible();
  await system.getByRole('button', { name: 'RESUME / ゲームへ戻る' }).click();
  await expect(page.getByRole('button', { name: 'SYSTEM' })).toBeFocused();
  await expect(stage).toHaveAttribute('data-subtitle-size', 'large');
  await expect(stage).toHaveAttribute('data-subtitle-background', 'solid');
  await expect(stage).toHaveAttribute('data-text-speed', 'fast');

  await page.keyboard.press('ArrowLeft');
  await page.getByRole('button', { name: 'インターホンを調べる' }).click();
  const narrative = page.getByRole('dialog', { name: 'メッセージ' });
  await expect(narrative).toHaveAttribute('data-narrative-kind', 'discovery');
  await expect(narrative).toHaveCSS('animation-duration', '0.08s');
  const narrativeText = narrative.locator('.narrative-text');
  await expect(narrativeText).toHaveCSS('font-size', /(?:2[0-9]|3[0-9])px/);
  await expect(narrativeText).toHaveAttribute('data-text-complete', 'true');
  await narrative.getByRole('button', { name: '閉じる' }).click();
  await expect(narrative).toBeHidden();
  await expect(page.getByTestId('world-canvas')).toBeVisible();

  await page.getByRole('button', { name: 'SYSTEM' }).click();
  const motionSystem = page.getByRole('dialog', { name: 'SYSTEM' });
  await motionSystem
    .getByRole('button', {
      name: 'TEXT & SOUND / 字幕・サウンド設定',
    })
    .click();
  await motionSystem
    .getByRole('button', { name: 'REDUCE MOTION / 動き軽減 OFF' })
    .click();
  await motionSystem
    .getByRole('button', { name: 'RESUME / ゲームへ戻る' })
    .click();
  await expect(stage).toHaveAttribute('data-inspection-motion', 'crossfade');
  await expect(page.locator('html')).toHaveAttribute(
    'data-reduced-motion',
    'true',
  );

  await page.reload();
  await page.getByRole('button', { name: '続きから' }).click();
  await page.getByRole('button', { name: 'SYSTEM' }).click();
  const restoredSystem = page.getByRole('dialog', { name: 'SYSTEM' });
  await restoredSystem
    .getByRole('button', {
      name: 'TEXT & SOUND / 字幕・サウンド設定',
    })
    .click();
  await expect(
    restoredSystem.getByRole('button', { name: '大', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    restoredSystem.getByRole('button', { name: '高コントラスト' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    restoredSystem.getByRole('button', { name: '速い' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(restoredSystem.getByLabel(/EFFECTS \/ 効果音/)).toHaveValue(
    '35',
  );
  await expect(
    restoredSystem.getByRole('button', {
      name: /MASTER \/ サウンド OFF/,
    }),
  ).toBeVisible();
  await expect(
    restoredSystem.getByRole('button', {
      name: 'REDUCE MOTION / 動き軽減 ON',
    }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test.describe('touch input', () => {
  test.use({ hasTouch: true });

  test('touch reaches the same breaker puzzle', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'ゲーム開始' }).tap();
    for (let index = 0; index < 6; index += 1) {
      await expect(page.locator('.narrative-text')).toHaveAttribute(
        'data-text-complete',
        'true',
      );
      await page.getByRole('button', { name: '次へ' }).tap();
    }
    await expect(page.locator('.narrative-text')).toHaveAttribute(
      'data-text-complete',
      'true',
    );
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
    const breaker = page
      .getByLabel('調査対象')
      .getByRole('button', { name: 'ブレーカーパネルを調べる' });
    await breaker.tap();
    await expect(
      page.getByRole('heading', { name: '非常電源をつなぐ' }),
    ).toBeVisible();
  });
});
