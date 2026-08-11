import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
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

  it('submits carrier offsets when the waveforms themselves reach the lock point', async () => {
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

    fireEvent.keyDown(screen.getByRole('slider', { name: 'CHANNEL A' }), {
      key: 'ArrowRight',
    });
    fireEvent.keyDown(screen.getByRole('slider', { name: 'CHANNEL A' }), {
      key: 'ArrowRight',
    });
    fireEvent.keyDown(screen.getByRole('slider', { name: 'CHANNEL C' }), {
      key: 'ArrowLeft',
    });

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith('puzzle_carrier_sync', [
        'right-2',
        'none',
        'left-1',
      ]),
    );
  });

  it('fixes the packet header and submits the visible connector order', async () => {
    const onSubmit = vi.fn();
    render(
      <PuzzleDevice
        embedded
        puzzleId="puzzle_packet_repair"
        failures={0}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: '固定されたHEADER断片C' }),
    ).toBeDisabled();
    for (const [fragment, rail] of [
      ['D', 2],
      ['A', 3],
      ['B', 4],
    ] as const) {
      fireEvent.click(
        screen.getByRole('button', { name: `断片${fragment}を持つ` }),
      );
      fireEvent.click(
        screen.getByRole('button', {
          name: `レール${rail}へ断片${fragment}を置く`,
        }),
      );
    }

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith('puzzle_packet_repair', [
        'c',
        'd',
        'a',
        'b',
      ]),
    );
    expect(screen.getByText('CONTINUITY')).toBeInTheDocument();
    expect(screen.queryByText('FRAME ERROR。')).not.toBeInTheDocument();
  });

  it('keeps a broken packet arrangement visible for correction', async () => {
    const onSubmit = vi.fn();
    const view = render(
      <PuzzleDevice
        embedded
        puzzleId="puzzle_packet_repair"
        failures={0}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    const device = within(view.container);

    for (const [fragment, rail] of [
      ['A', 2],
      ['B', 3],
      ['D', 4],
    ] as const) {
      fireEvent.click(
        device.getByRole('button', { name: `断片${fragment}を持つ` }),
      );
      fireEvent.click(
        device.getByRole('button', {
          name: `レール${rail}へ断片${fragment}を置く`,
        }),
      );
    }
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    view.rerender(
      <PuzzleDevice
        embedded
        puzzleId="puzzle_packet_repair"
        failures={1}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    expect(device.getByText('SIGNAL BREAK')).toBeInTheDocument();
    expect(
      device.getByRole('button', {
        name: 'レール2の断片Aを持ち上げる',
      }),
    ).toBeInTheDocument();
    expect(device.getByText('CONTINUITY / BROKEN')).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(1);
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
