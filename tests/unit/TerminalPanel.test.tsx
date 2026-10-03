import { useState } from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  StoryStage,
  TerminalMenuId,
} from '../../src/game/machine/gameMachine';
import {
  packetTexts,
  puzzleIds,
  type PuzzleId,
} from '../../src/game/puzzles/storyPuzzles';
import { TerminalPanel } from '../../src/ui/terminal/TerminalPanel';
import { introEntries } from '../../src/ui/narrative/narrativeArchive';

const failures = Object.fromEntries(puzzleIds.map((id) => [id, 0])) as Record<
  PuzzleId,
  number
>;
const propsFor = (stage: StoryStage) => ({
  stage,
  completedPuzzleIds:
    stage === 'transmission_ready'
      ? [...puzzleIds]
      : puzzleIds.slice(0, puzzleIds.indexOf(stage as PuzzleId)),
  puzzleFailures: failures,
  narrativeHistory: introEntries.slice(0, 3),
  onSelect: vi.fn(),
  onClose: vi.fn(),
  onPuzzleSubmit: vi.fn(),
  onTransmit: vi.fn(),
});

function Session() {
  const [menuId, onSelect] = useState<TerminalMenuId>('system');
  return (
    <TerminalPanel
      {...propsFor('puzzle_carrier_sync')}
      menuId={menuId}
      onSelect={onSelect}
    />
  );
}

afterEach(cleanup);

describe('TerminalPanel', () => {
  it('preserves adjustments without exposing hidden controls to keyboard navigation', () => {
    render(<Session />);
    fireEvent.keyDown(screen.getByRole('slider', { name: 'CHANNEL A' }), {
      key: 'ArrowRight',
    });
    fireEvent.click(screen.getByRole('button', { name: 'LOG' }));
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'SYSTEM' }));
    expect(screen.getByRole('slider', { name: 'CHANNEL A' })).toHaveAttribute(
      'aria-valuenow',
      '-1',
    );
  });

  it('keeps a partial transmission while reading only seen history and returning focus', () => {
    const props = propsFor('puzzle_transmission_window');
    const view = render(<TerminalPanel {...props} menuId="system" />);
    const place = screen.getByRole('button', { name: /^受信後の返事/ });
    fireEvent.click(
      screen.getByRole('button', { name: `送信する文「${packetTexts[0]}」` }),
    );
    fireEvent.click(place);
    fireEvent.keyDown(screen.getByRole('slider', { name: '送信側の時間軸' }), {
      key: 'ArrowLeft',
    });
    fireEvent.click(screen.getByRole('button', { name: '送信ケーブルを持つ' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'ECHO BUFFER RETURNの端子' }),
    );
    const held = screen.getByRole('button', {
      name: `送信する文「${packetTexts[1]}」`,
    });
    fireEvent.click(held);
    const opener = screen.getByRole('button', { name: '会話履歴' });
    opener.focus();
    fireEvent.click(opener);
    const history = screen.getByRole('dialog', { name: '会話履歴' });
    expect(within(history).getByText('……聞こえるか？')).toBeVisible();
    expect(
      within(history).queryByText('20分後のお前だ。'),
    ).not.toBeInTheDocument();
    expect(
      within(history).queryByText('説明してる時間がない。まず電源を戻せ。'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(
      view.container.querySelector('.terminal-instrument'),
    ).toHaveAttribute('inert');
    const scroll = within(history).getByRole('region', {
      name: '記録された会話',
    });
    const back = within(history).getByRole('button', {
      name: 'BACK / 端末に戻る',
    });
    expect(back).toHaveFocus();
    fireEvent.keyDown(back, { key: 'Tab', shiftKey: true });
    expect(scroll).toHaveFocus();
    fireEvent.keyDown(scroll, { key: 'Tab' });
    expect(back).toHaveFocus();
    const globalKey = vi.fn();
    window.addEventListener('keydown', globalKey);
    fireEvent.keyDown(scroll, { key: 'Escape' });
    window.removeEventListener('keydown', globalKey);
    expect(globalKey).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
    expect(opener).toHaveFocus();
    expect(place).toHaveAccessibleName(
      expect.stringContaining(packetTexts[0]!),
    );
    expect(
      screen.getByRole('slider', { name: '送信側の時間軸' }),
    ).toHaveAttribute('aria-valuenow', '-20');
    expect(
      screen.getByRole('button', {
        name: 'ECHO BUFFER RETURNの端子、接続済み',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(held).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole('button', { name: 'BACK / 端末に戻る' }));
    expect(opener).toHaveFocus();
    expect(held).toHaveAttribute('aria-pressed', 'true');
    expect(props.onPuzzleSubmit).not.toHaveBeenCalled();
  });

  it('reveals packet text and identity only after their discoveries', () => {
    const view = render(
      <TerminalPanel
        {...propsFor('puzzle_signal_investigation')}
        menuId="audio"
      />,
    );
    expect(screen.queryByText(packetTexts[3]!)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /音声を再生/ }),
    ).not.toBeInTheDocument();
    view.rerender(
      <TerminalPanel
        {...propsFor('puzzle_voiceprint_calibration')}
        menuId="audio"
      />,
    );
    expect(
      screen.getByRole('list', { name: '復元済みパケット' }),
    ).toHaveTextContent(packetTexts[3]!);
    expect(screen.queryByText(/E-01 OCCUPANT/)).not.toBeInTheDocument();
    view.rerender(
      <TerminalPanel
        {...propsFor('puzzle_transmission_window')}
        menuId="audio"
      />,
    );
    expect(
      screen.getByText('VOICEPRINT / MATCH / E-01 OCCUPANT'),
    ).toBeVisible();
  });

  it('keeps transmission locked until verified, then accepts it only once', () => {
    const props = propsFor('puzzle_transmission_window');
    const view = render(<TerminalPanel {...props} menuId="system" />);
    const transmit = () =>
      screen.getByRole('button', { name: '赤い送信ボタンを押す' });
    expect(transmit()).toBeDisabled();
    fireEvent.click(transmit());
    expect(props.onTransmit).not.toHaveBeenCalled();
    view.rerender(
      <TerminalPanel
        {...props}
        stage="transmission_ready"
        completedPuzzleIds={[...puzzleIds]}
        menuId="system"
      />,
    );
    fireEvent.click(transmit());
    fireEvent.click(transmit());
    expect(props.onTransmit).toHaveBeenCalledOnce();
  });
});
