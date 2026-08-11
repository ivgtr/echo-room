import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SystemMenu } from '../../src/ui/system/SystemMenu';
import {
  defaultSoundLevels,
  defaultSubtitleSettings,
} from '../../src/ui/system/uiSettings';

describe('SystemMenu', () => {
  it('opens only discovered archive data and updates accessibility settings', () => {
    const onSoundLevelChange = vi.fn();
    const onSubtitleSettingChange = vi.fn();
    const onToggleMotion = vi.fn();
    render(
      <SystemMenu
        objective="端末を確認する。"
        activeElapsedMs={0}
        powerRestored
        reservePower={false}
        soundEnabled={false}
        soundLevels={defaultSoundLevels}
        subtitleSettings={defaultSubtitleSettings}
        visualAssist={false}
        motionReduced={false}
        inventoryAvailable={false}
        hintAvailable
        hintUnlocked={false}
        narrativeHistory={[
          {
            id: 'seen_line',
            kind: 'communication',
            speaker: 'UNKNOWN',
            text: '……聞こえるか？',
          },
        ]}
        documents={[
          {
            id: 'seen_document',
            title: 'EMERGENCY POWER TEST',
            body: '低い回路から接続する。',
          },
        ]}
        returnFocusRef={createRef<HTMLElement>()}
        onClose={vi.fn()}
        onToggleSound={vi.fn()}
        onSoundLevelChange={onSoundLevelChange}
        onSubtitleSettingChange={onSubtitleSettingChange}
        onToggleAssist={vi.fn()}
        onToggleMotion={onToggleMotion}
        onInventory={vi.fn()}
        onHint={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'ARCHIVE / 会話履歴・資料再読',
      }),
    );
    expect(screen.getByText('……聞こえるか？')).toBeVisible();
    expect(screen.getByText('EMERGENCY POWER TEST')).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', { name: 'BACK / SYSTEMへ戻る' }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'TEXT & SOUND / 字幕・サウンド設定',
      }),
    );
    expect(screen.queryByText(/VOICE \/ 会話/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'MASTER / サウンド OFF' }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /^大$/ }));
    expect(onSubtitleSettingChange).toHaveBeenCalledWith('size', 'large');
    fireEvent.change(screen.getByLabelText(/EFFECTS \/ 効果音/), {
      target: { value: '35' },
    });
    expect(onSoundLevelChange).toHaveBeenCalledWith('effects', 35);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'REDUCE MOTION / 動き軽減 OFF',
      }),
    );
    expect(onToggleMotion).toHaveBeenCalledOnce();
  });
});
