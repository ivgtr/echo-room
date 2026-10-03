import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
  onSelect: vi.fn(),
  onClose: vi.fn(),
  onPuzzleSubmit: vi.fn(),
  onTransmit: vi.fn(),
  voicePlayback: { entryId: null, status: 'idle' as const },
  voiceEnabled: true,
  onReplayVoice: vi.fn(),
  onPacketEntryChange: vi.fn(),
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

  it('reveals packet text and identity only after their discoveries', () => {
    const onReplayVoice = vi.fn();
    const view = render(
      <TerminalPanel
        {...propsFor('puzzle_signal_investigation')}
        menuId="audio"
        onReplayVoice={onReplayVoice}
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
        onReplayVoice={onReplayVoice}
      />,
    );
    expect(
      screen.getByRole('list', { name: '復元済みパケット' }),
    ).toHaveTextContent(packetTexts[3]!);
    expect(screen.queryByText(/E-01 OCCUPANT/)).not.toBeInTheDocument();
    expect(onReplayVoice).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'PACKET 04 音声を再生' }),
    );
    expect(onReplayVoice).toHaveBeenCalledExactlyOnceWith('packet_04');
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
