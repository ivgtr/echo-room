import { fireEvent, render, screen } from '@testing-library/react';
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
    expect(screen.getByText('搬送波同期器')).toBeVisible();
    expect(screen.getByRole('slider', { name: 'CHANNEL A' })).toHaveValue('-2');
    expect(screen.getByRole('slider', { name: 'CHANNEL C' })).toHaveValue('1');
    expect(screen.getByText('位置数値：A -2 / B 0 / C +1')).toBeVisible();
    expect(screen.queryByText(/早い波は右/)).not.toBeInTheDocument();
    expect(screen.queryByText('この答えで確認する')).not.toBeInTheDocument();
    expect(screen.queryByText(/選択済み/)).not.toBeInTheDocument();
  });

  it('keeps the facility map meaningful as a conduit layer', () => {
    render(
      <TerminalPanel
        {...baseProps}
        menuId="security"
        stage="puzzle_signal_route"
      />,
    );
    expect(screen.getByText('通信配線トレーサー')).toBeVisible();
    expect(screen.getByText('ECHO BUFFER RETURN ○')).toBeVisible();
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
    expect(screen.queryByText('保守ロッカー')).not.toBeInTheDocument();
  });

  it('makes the red button a payoff only after puzzle ten', () => {
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
    expect(screen.getByText(/10 \/ 10/)).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', { name: '赤い送信ボタンを押す' }),
    );
    expect(onTransmit).toHaveBeenCalledOnce();
  });
});
