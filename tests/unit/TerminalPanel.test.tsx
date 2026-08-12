import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { puzzleIds, type PuzzleId } from '../../src/game/puzzles/storyPuzzles';
import { TerminalPanel } from '../../src/ui/terminal/TerminalPanel';

const failures = Object.fromEntries(puzzleIds.map((id) => [id, 0])) as Record<
  PuzzleId,
  number
>;

const baseProps = {
  completedPuzzleIds: ['puzzle_power_route'] as PuzzleId[],
  puzzleFailures: failures,
  onSelect: vi.fn(),
  onClose: vi.fn(),
  onPuzzleSubmit: vi.fn(),
  onTransmit: vi.fn(),
};

describe('TerminalPanel', () => {
  it('presents carrier synchronization as a directly adjustable device', () => {
    render(
      <TerminalPanel
        {...baseProps}
        menuId="system"
        stage="puzzle_carrier_sync"
      />,
    );
    expect(screen.getByText('波形調整')).toBeVisible();
    expect(screen.getByRole('slider', { name: 'CHANNEL A' })).toHaveAttribute(
      'aria-valuenow',
      '-2',
    );
    expect(screen.getByRole('slider', { name: 'CHANNEL C' })).toHaveAttribute(
      'aria-valuenow',
      '1',
    );
    expect(screen.getByText('OVERLAP 42%')).toBeVisible();
    expect(screen.getByText('OVERLAP 71%')).toBeVisible();
    expect(screen.queryByText(/早い波は右/)).not.toBeInTheDocument();
    expect(screen.queryByText('この答えで確認する')).not.toBeInTheDocument();
    expect(screen.queryByText(/選択済み/)).not.toBeInTheDocument();
  });

  it('keeps the facility map meaningful as a conduit layer', () => {
    render(
      <TerminalPanel
        {...baseProps}
        menuId="log"
        stage="puzzle_signal_investigation"
      />,
    );
    expect(screen.getByText('通信記録と配線')).toBeVisible();
    expect(screen.getByText('RECEIVE')).toBeVisible();
  });

  it('shows diegetic status and the terminal nameplate before the locker', () => {
    render(
      <TerminalPanel
        {...baseProps}
        menuId="system"
        stage="puzzle_maintenance_lock"
      />,
    );
    expect(screen.getByText('TERMINAL ║')).toBeVisible();
    expect(
      screen.getByText('WEST MAINTENANCE LOCK / LOCAL CONTROL'),
    ).toBeVisible();
    expect(screen.queryByText('ロッカーの記号錠')).not.toBeInTheDocument();
  });

  it('does not reveal the exact negative delay before communication investigation', () => {
    const view = render(
      <TerminalPanel
        {...baseProps}
        menuId="system"
        stage="puzzle_signal_investigation"
      />,
    );
    const terminal = within(view.container);
    expect(terminal.getByText('--:--:-- / CALIBRATION ERROR')).toBeVisible();
    expect(terminal.queryByText('-00:20:00')).not.toBeInTheDocument();
  });

  it('makes the red button a payoff only after puzzle seven', () => {
    const onTransmit = vi.fn();
    render(
      <TerminalPanel
        {...baseProps}
        menuId="system"
        stage="transmission_ready"
        completedPuzzleIds={[...puzzleIds]}
        onTransmit={onTransmit}
      />,
    );
    expect(screen.getByText(/7 \/ 7/)).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', { name: '赤い送信ボタンを押す' }),
    );
    expect(onTransmit).toHaveBeenCalledOnce();
  });
});
