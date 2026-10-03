import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SystemMenu } from '../../src/ui/system/SystemMenu';
import { getArchiveDocuments } from '../../src/ui/narrative/narrativeArchive';
import {
  defaultSoundLevels,
  defaultSubtitleSettings,
} from '../../src/ui/system/uiSettings';

describe('SystemMenu', () => {
  it('shows read subtitles and returns from the archive without voice controls', () => {
    const documents = getArchiveDocuments(true, ['item_floor_map'], []);
    const map = documents.find(
      (document) => document.id === 'document_floor_map',
    )!;
    expect(map.body).toContain('実線は通信');
    expect(map.body).not.toMatch(/J-2|RETURN|部屋はない/);
    expect(getArchiveDocuments(true, [], [])).not.toContainEqual(map);
    expect(
      getArchiveDocuments(
        true,
        ['item_floor_map'],
        ['puzzle_signal_investigation'],
      ).at(-1)?.body,
    ).toContain('ECHO BUFFER RETURN');
    render(
      <SystemMenu
        objective="端末を確認する。"
        activeElapsedMs={0}
        powerRestored
        reservePower={false}
        soundEnabled
        soundLevels={defaultSoundLevels}
        subtitleSettings={defaultSubtitleSettings}
        visualAssist={false}
        motionReduced={false}
        inventoryAvailable={false}
        hintAvailable
        hintUnlocked={false}
        narrativeHistory={[
          {
            id: 'intro_02',
            kind: 'communication',
            speaker: 'UNKNOWN',
            text: '……聞こえるか？',
          },
        ]}
        documents={documents}
        returnFocusRef={createRef<HTMLElement>()}
        initialFocus={null}
        onClose={vi.fn()}
        onToggleSound={vi.fn()}
        onSoundLevelChange={vi.fn()}
        onSubtitleSettingChange={vi.fn()}
        onToggleAssist={vi.fn()}
        onToggleMotion={vi.fn()}
        onInventory={vi.fn()}
        onHint={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'ARCHIVE / 会話履歴・資料',
      }),
    );
    expect(screen.getByText('……聞こえるか？')).toBeVisible();
    expect(screen.getByText(map.body)).toBeVisible();
    expect(screen.queryByText(/J-2|RETURN/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /音声を再生/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('20分後のお前だ。')).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'BACK / SYSTEMへ戻る' }),
    );
    expect(
      screen.getByRole('button', { name: 'RESUME / ゲームへ戻る' }),
    ).toBeVisible();
  });
});
