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
  it('presents carrier synchronization as a multi-decision visual puzzle', () => {
    render(
      <TerminalPanel
        {...baseProps}
        menuId="system"
        stage="puzzle_carrier_sync"
      />,
    );
    expect(screen.getByText('搬送波同期')).toBeVisible();
    expect(screen.getByLabelText('比較用の波形特徴')).toBeVisible();
    expect(
      screen.getByRole('button', { name: '構成を検証する' }),
    ).toBeDisabled();
  });

  it('keeps the facility map meaningful as a conduit layer', () => {
    render(
      <TerminalPanel
        {...baseProps}
        menuId="security"
        stage="puzzle_signal_route"
      />,
    );
    expect(screen.getByText('通信経路追跡')).toBeVisible();
    expect(screen.getByText(/ECHO BUFFER終端も環/)).toBeVisible();
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
