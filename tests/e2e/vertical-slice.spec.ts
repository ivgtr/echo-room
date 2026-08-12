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
    await page.getByRole('button', { name: '次の文章へ' }).click();
  }
  await expect(page.locator('.narrative-text')).toHaveAttribute(
    'data-text-complete',
    'true',
  );
  await page.getByRole('button', { name: '探索を始める' }).click();
}

async function dismissEventNarrative(page: Page) {
  const narrative = page.locator('.narrative-panel:visible');
  while ((await narrative.count()) > 0) {
    await expect(narrative.locator('.narrative-text')).toHaveAttribute(
      'data-text-complete',
      'true',
      { timeout: 10_000 },
    );
    await narrative.getByRole('button', { name: '次の文章へ' }).press('Enter');
  }
}

test('advances narrative from the full screen without visible action buttons', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ゲーム開始' }).click();
  const stage = page.locator('.logical-stage');
  const narrative = page.getByRole('dialog', { name: 'メッセージ' });
  await expect(narrative.locator('.narrative-text')).toHaveAttribute(
    'data-text-complete',
    'true',
  );
  await expect(narrative.locator('.narrative-actions')).toHaveCount(0);

  const stageBox = await stage.boundingBox();
  expect(stageBox).not.toBeNull();
  await page.mouse.click(
    stageBox!.x + stageBox!.width / 2,
    stageBox!.y + stageBox!.height * 0.15,
  );
  await expect(page.getByRole('dialog', { name: '通信' })).toContainText(
    '聞こえるか',
  );
});

test('aligns locker controls to the close-up artwork coordinate system', async ({
  page,
}) => {
  await page.addInitScript(
    installProgressSave,
    createProgressSave({
      checkpointId: 'checkpoint_puzzle_02',
      locationId: 'location_west_wall',
      storyStage: 'puzzle_maintenance_lock',
      completedPuzzleIds: ['puzzle_power_route', 'puzzle_carrier_sync'],
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: '続きから' }).click();
  await page.getByRole('button', { name: 'ロッカーを調べる' }).click();

  const device = page.locator('[data-puzzle-id="puzzle_maintenance_lock"]');
  const firstDial = device.getByRole('spinbutton', { name: 'ダイヤル1' });
  const handle = device.getByRole('button', { name: 'ロッカーのハンドル' });
  await expect(firstDial).toBeVisible();
  await firstDial.focus();
  const [deviceBox, dialBox, handleBox] = await Promise.all([
    device.boundingBox(),
    firstDial.boundingBox(),
    handle.boundingBox(),
  ]);
  expect(deviceBox).not.toBeNull();
  expect(dialBox).not.toBeNull();
  expect(handleBox).not.toBeNull();

  const normalized = (box: NonNullable<typeof dialBox>) => ({
    x: (box.x - deviceBox!.x) / deviceBox!.width,
    y: (box.y - deviceBox!.y) / deviceBox!.height,
    width: box.width / deviceBox!.width,
  });
  const dial = normalized(dialBox!);
  const lockHandle = normalized(handleBox!);
  expect(dial.x).toBeCloseTo(560 / 1672, 2);
  expect(dial.y).toBeCloseTo(223 / 941, 2);
  expect(dial.width).toBeCloseTo(113 / 1672, 2);
  expect(lockHandle.x).toBeCloseTo(570 / 1672, 2);
  expect(lockHandle.y).toBeCloseTo(608 / 941, 2);
});

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
    [/右を向く（東側/, '東側'],
    [/右を向く（南側/, '南側'],
    [/右を向く（西側/, '西側'],
    [/右を向く（北側/, '北側'],
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
    await page.getByRole('button', { name: '次の文章へ' }).press('Enter');
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
    name: 'ドアを調べる',
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
    system.getByText('机のメモと壊れた回路を調べ、ブレーカーを入れる。'),
  ).toBeVisible();
  const archiveEntry = system.getByRole('button', {
    name: 'ARCHIVE / 会話履歴・資料',
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
    .getByRole('button', { name: 'ブレーカーを調べる' })
    .press('Enter');

  const powerPuzzle = page.locator(
    '[data-puzzle-id="puzzle_power_route"]:visible',
  );
  const stageRatio = async () =>
    powerPuzzle.locator('.power-stage').evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.width / bounds.height;
    });
  await expect.poll(stageRatio).toBeCloseTo(1672 / 941, 2);
  await page.setViewportSize({ width: 1440, height: 800 });
  await expect.poll(stageRatio).toBeCloseTo(1672 / 941, 2);
  await powerPuzzle
    .getByRole('button', { name: 'TERMINAL回路、OFF' })
    .press('Enter');
  await expect(powerPuzzle.getByText('PROTECTION TRIPPED')).toBeVisible();
  await page.screenshot({ path: 'tmp/power-single-status-light.png' });
  await powerPuzzle
    .getByRole('button', { name: 'DOOR回路、ON' })
    .press('Enter');
  await expect(
    powerPuzzle.getByRole('button', { name: 'DOOR回路、OFF' }),
  ).toHaveAttribute('aria-pressed', 'false');
  await expect(
    powerPuzzle.getByRole('button', { name: 'TERMINAL回路、OFF' }),
  ).toHaveAttribute('aria-pressed', 'false');
  await expect(powerPuzzle.getByText('BOOT SEQUENCE READY')).toBeVisible();
  await page.screenshot({ path: 'tmp/power-sequence-ready.png' });
  await powerPuzzle
    .getByRole('button', { name: 'ECHO BUFFER回路、OFF' })
    .press('Enter');
  await expect(powerPuzzle.getByText('CONTROL SIGNAL MISSING')).toBeVisible();
  for (const name of ['TERMINAL回路、OFF', 'INTERCOM回路、OFF'])
    await powerPuzzle.getByRole('button', { name }).press('Enter');
  await expect(powerPuzzle.locator('.power-panel-base')).toHaveAttribute(
    'src',
    /gfx-close-005__intercom-powered__preview-flat\.webp/,
  );
  await page.screenshot({ path: 'tmp/power-sequence-vfx.png' });
  await powerPuzzle
    .getByRole('button', { name: 'ECHO BUFFER回路、OFF' })
    .press('Enter');

  await expect(page.getByText('MAIN POWER ONLINE')).toBeVisible();
  await expect(world).toHaveAttribute('data-transition-state', 'idle');
  await expect(canvas).toHaveAttribute(
    'data-persistence-marker',
    'before-power',
  );
  const saveToast = page.getByText('自動保存しました');
  await expect(saveToast).toBeVisible();
  await dismissEventNarrative(page);
  await page.getByRole('button', { name: '端末を調べる' }).press('Enter');
  const terminal = page.getByRole('dialog', { name: '端末' });
  await expect(terminal.getByText('波形調整')).toBeVisible();
  await expect(saveToast).toBeHidden({ timeout: 5000 });
  await terminal
    .getByRole('button', { name: 'BACK / 部屋に戻る' })
    .press('Enter');
  await page.reload();
  await page.getByRole('button', { name: '続きから' }).press('Enter');
  await expect(page.getByText('MAIN POWER ONLINE')).toBeVisible();
  await expect(saveToast).toHaveCount(0);
  await expect(
    page.getByText('机の走り書きと、端末の波の位置を見比べる。'),
  ).toBeHidden();
  await page.getByRole('button', { name: 'SYSTEM' }).press('Enter');
  await expect(
    page
      .getByRole('dialog', { name: 'SYSTEM' })
      .getByText('机の走り書きと、端末の波の位置を見比べる。'),
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
    .getByRole('button', { name: 'ARCHIVE / 会話履歴・資料' })
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
    page.getByRole('button', { name: 'ドアを調べる' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'ドアを調べる' }),
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
  await page.evaluate(() => {
    const nativeSetTimeout = window.setTimeout.bind(window);
    let inspectionTimerExtended = false;
    window.setTimeout = ((
      handler: TimerHandler,
      timeout?: number,
      ...args: unknown[]
    ) => {
      if (timeout === 380 && !inspectionTimerExtended) {
        inspectionTimerExtended = true;
        return nativeSetTimeout(handler, 3000, ...args);
      }
      return nativeSetTimeout(handler, timeout, ...args);
    }) as typeof window.setTimeout;
  });
  await intercom.dispatchEvent('click');
  const transitionMarker = page.locator('.inspection-transition-marker');
  await expect(transitionMarker).toBeVisible();
  await expect(transitionMarker).toHaveAttribute('data-trace-duration', '110');
  await expect
    .poll(() =>
      transitionMarker.evaluate((canvas) => {
        if (!(canvas instanceof HTMLCanvasElement)) return 0;
        const pixels = canvas
          .getContext('2d')
          ?.getImageData(0, 0, canvas.width, canvas.height).data;
        if (!pixels) return 0;
        let paintedPixels = 0;
        for (let index = 3; index < pixels.length; index += 4) {
          if (pixels[index] !== 0) paintedPixels += 1;
        }
        return paintedPixels;
      }),
    )
    .toBeGreaterThan(0);
  const transitionMetrics = await page
    .locator('.inspection-transition-target')
    .evaluate((target) => {
      const marker = target.querySelector('.inspection-transition-marker');
      const label = target.querySelector('.inspection-transition-label');
      if (
        !(marker instanceof HTMLCanvasElement) ||
        !(label instanceof HTMLElement)
      )
        return null;
      const markerBox = marker.getBoundingClientRect();
      const labelBox = label.getBoundingClientRect();
      const context = marker.getContext('2d');
      const pixels = context?.getImageData(
        0,
        0,
        marker.width,
        marker.height,
      ).data;
      let paintedPixels = 0;
      if (pixels) {
        for (let index = 3; index < pixels.length; index += 4) {
          if (pixels[index] !== 0) paintedPixels += 1;
        }
      }
      return {
        markerWidth: markerBox.width,
        labelLeft: labelBox.left,
        labelRight: labelBox.right,
        paintedPixels,
      };
    });
  expect(transitionMetrics).not.toBeNull();
  expect(transitionMetrics!.markerWidth).toBeGreaterThan(0);
  expect(transitionMetrics!.labelLeft).toBeGreaterThanOrEqual(stageBox!.x);
  expect(transitionMetrics!.labelRight).toBeLessThanOrEqual(
    stageBox!.x + stageBox!.width,
  );
  expect(transitionMetrics!.paintedPixels).toBeGreaterThan(0);
  await page.getByRole('button', { name: '文章をすべて表示' }).click();
  await expect(page.locator('.narrative-text')).toHaveAttribute(
    'data-text-complete',
    'true',
  );
  await page.getByRole('button', { name: 'メッセージを閉じる' }).click();
  const doorBox = await page
    .getByRole('button', { name: 'ドアを調べる' })
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
    name: '端末を調べる',
  });
  await page.clock.install();
  await terminalHotspot.evaluate((element) => {
    if (element instanceof HTMLElement) {
      element.click();
      element.click();
    }
  });
  await expect(stage).toHaveAttribute('data-inspection-phase', 'approaching');
  await expect(page.locator('.inspection-transition-marker')).toBeVisible();
  await page.clock.fastForward(380);
  const terminal = page.getByRole('dialog', { name: '端末' });
  await expect(terminal).toHaveCount(1);
  await expect(stage).toHaveAttribute('data-inspection-phase', 'active');
  const worldCanvas = page.getByTestId('world-canvas').locator('canvas');
  await expect(worldCanvas).toHaveAttribute('aria-label', /東側/);
  await page.keyboard.press('ArrowRight');
  await expect(worldCanvas).toHaveAttribute('aria-label', /東側/);
  const firstControl = terminal.getByRole('button', { name: 'SYSTEM' });
  await expect(firstControl).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(
    terminal.getByRole('button', { name: 'BACK / 部屋に戻る' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(firstControl).toBeFocused();
  await terminal.getByRole('button', { name: 'BACK / 部屋に戻る' }).click();
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
  const door = page.getByRole('button', { name: 'ドアを調べる' });
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
  await page.clock.install();
  await door.dispatchEvent('click');
  await expect(stage).toHaveAttribute('data-inspection-phase', 'approaching');
  await expect(page.locator('.inspection-transition-marker')).toHaveAttribute(
    'data-trace-duration',
    '0',
  );
  await expect(world).toHaveCSS('transform', 'none');
  await page.clock.fastForward(380);
  await expect(
    page.getByText('非常ロックがかかっている。通信が終わるまで開かない。'),
  ).toBeVisible();
});

test('system subviews return one level before resuming exploration', async ({
  page,
}) => {
  await page.addInitScript(
    installProgressSave,
    createProgressSave({ inventory: ['item_screwdriver'] }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: '続きから' }).click();
  const stage = page.locator('.logical-stage');
  await page.getByRole('button', { name: 'SYSTEM' }).click();
  const system = page.getByRole('dialog', { name: 'SYSTEM' });
  await system
    .getByRole('button', { name: 'ARCHIVE / 会話履歴・資料' })
    .click();
  await expect(system.getByText('……聞こえるか？')).toBeVisible();
  await expect(system.getByText('朝番への引き継ぎ')).toBeVisible();
  await expect(system.getByText('波を見るとき')).toBeVisible();
  await expect(system.getByText('戸締まり前')).toBeVisible();
  await expect(
    system.getByRole('button', { name: 'RESUME / ゲームへ戻る' }),
  ).toHaveCount(0);
  await system.getByRole('button', { name: 'BACK / SYSTEMへ戻る' }).click();
  await system.getByRole('button', { name: 'INVENTORY / 所持品' }).click();
  const inventory = page.getByRole('dialog', { name: '所持品' });
  await inventory.getByRole('button', { name: 'BACK / SYSTEMへ戻る' }).click();
  await expect(system).toBeVisible();
  await expect(
    system.getByRole('button', { name: 'INVENTORY / 所持品' }),
  ).toBeFocused();
  await system.getByRole('button', { name: /HINT \/ ヒント/ }).click();
  const hint = page.getByRole('dialog', { name: 'ヒント' });
  await hint.getByRole('button', { name: 'BACK / SYSTEMへ戻る' }).click();
  await expect(system).toBeVisible();
  await expect(
    system.getByRole('button', { name: /HINT \/ ヒント/ }),
  ).toBeFocused();
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
  await system.getByRole('button', { name: 'BACK / SYSTEMへ戻る' }).click();
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
  await narrative.getByRole('button', { name: 'メッセージを閉じる' }).click();
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
    .getByRole('button', { name: 'BACK / SYSTEMへ戻る' })
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
      await page.getByRole('button', { name: '次の文章へ' }).tap();
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
    ).toHaveAttribute('aria-label', /西側/);
    const breaker = page
      .getByLabel('調査対象')
      .getByRole('button', { name: 'ブレーカーを調べる' });
    await breaker.tap();
    await expect(page.getByRole('heading', { name: '非常電源' })).toBeVisible();
  });

  test('touch moves the carrier waveforms themselves', async ({ page }) => {
    await page.addInitScript(installProgressSave, createProgressSave());
    await page.goto('/');
    await page.getByRole('button', { name: '続きから' }).tap();
    await page.getByRole('button', { name: '端末を調べる' }).tap();

    const device = page.locator('[data-puzzle-id="puzzle_carrier_sync"]');
    await device.getByRole('slider', { name: 'CHANNEL A' }).tap();
    await device.getByRole('slider', { name: 'CHANNEL C' }).tap();

    await expect(device).toBeHidden();
  });
});
