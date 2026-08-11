import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PuzzleDevice } from '../../src/ui/puzzles/PuzzleDevice';

describe('PuzzleDevice', () => {
  it('uses cable isolation and the physical breaker order as the power answer', async () => {
    const onSubmit = vi.fn();
    render(
      <PuzzleDevice
        puzzleId="puzzle_power_route"
        failures={0}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'DOORケーブルを切り離す' }),
    );
    for (const name of [
      'TERMINALブレーカー',
      'INTERCOMブレーカー',
      'ECHO BUFFERブレーカー',
    ])
      fireEvent.click(screen.getByRole('button', { name }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith('puzzle_power_route', [
        'door',
        'terminal',
        'intercom',
        'buffer',
      ]),
    );
    expect(screen.queryByText(/選択済み/)).not.toBeInTheDocument();
    expect(screen.queryByText('この答えで確認する')).not.toBeInTheDocument();
  });

  it('submits carrier offsets when direct sliders reach the lock point', async () => {
    const onSubmit = vi.fn();
    render(
      <PuzzleDevice
        embedded
        puzzleId="puzzle_carrier_sync"
        failures={0}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole('slider', { name: 'CHANNEL A' }), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByRole('slider', { name: 'CHANNEL C' }), {
      target: { value: '0' },
    });

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith('puzzle_carrier_sync', [
        'right-2',
        'none',
        'left-1',
      ]),
    );
  });

  it('keeps a diegetic actuator for manual validation devices', () => {
    const onSubmit = vi.fn();
    render(
      <PuzzleDevice
        puzzleId="puzzle_maintenance_lock"
        failures={0}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    for (let index = 1; index <= 4; index += 1)
      fireEvent.keyDown(
        screen.getByRole('spinbutton', { name: `ダイヤル${index}` }),
        {
          key: 'ArrowUp',
        },
      );
    fireEvent.click(screen.getByRole('button', { name: 'LOCK HANDLE' }));

    expect(onSubmit).toHaveBeenCalledWith('puzzle_maintenance_lock', [
      'double',
      'ring',
      'triangle',
      'node',
    ]);
  });
});
