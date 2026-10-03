import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HintPanel } from '../../src/ui/hints/HintPanel';
import { SystemMenu } from '../../src/ui/system/SystemMenu';
import { getArchiveDocuments } from '../../src/ui/narrative/narrativeArchive';
import {
  defaultSoundLevels,
  defaultSubtitleSettings,
} from '../../src/ui/system/uiSettings';

afterEach(cleanup);

describe('SystemMenu', () => {
  it('shows power recovery clues progressively before other devices unlock', () => {
    const onReveal = vi.fn();
    const props = {
      stage: 'puzzle_power_route' as const,
      onReveal,
      onClose: vi.fn(),
    };
    const view = render(<HintPanel {...props} level={0} />);
    expect(screen.queryByText(/LEVEL/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '次のヒントを見る' }));
    expect(onReveal).toHaveBeenCalledOnce();
    view.rerender(<HintPanel {...props} level={1} />);
    expect(screen.getByText(/LEVEL 1/)).toHaveTextContent(
      '状態灯・煤・上の配線',
    );
    expect(screen.queryByText(/DOOR/)).not.toBeInTheDocument();
    view.rerender(<HintPanel {...props} level={2} />);
    expect(screen.getByText(/LEVEL 2/)).toHaveTextContent('DOOR回路を切る');
    expect(screen.queryByText(/TERMINAL/)).not.toBeInTheDocument();
    view.rerender(<HintPanel {...props} level={3} />);
    expect(screen.getByText(/LEVEL 3/)).toHaveTextContent(
      'TERMINAL、INTERCOM、ECHO BUFFER',
    );
    expect(
      screen.queryByRole('button', { name: '次のヒントを見る' }),
    ).not.toBeInTheDocument();
    expect(getArchiveDocuments(false, [], [])).toEqual([]);
  });

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
