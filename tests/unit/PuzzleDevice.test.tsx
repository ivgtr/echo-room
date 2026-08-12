import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PuzzleDevice } from '../../src/ui/puzzles/PuzzleDevice';

afterEach(() => vi.useRealTimers());

describe('PuzzleDevice', () => {
  it('isolates DOOR, rejects an out-of-order circuit, then restores power upstream first', async () => {
    const onSubmit = vi.fn();
    const view = render(
      <PuzzleDevice
        puzzleId="puzzle_power_route"
        failures={0}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    const leverSources = Array.from(
      view.container.querySelectorAll<HTMLImageElement>(
        '.breaker-lever-sprite',
      ),
      (image) => image.src,
    );
    expect(leverSources).toHaveLength(4);
    expect(new Set(leverSources)).toHaveLength(1);
    expect(view.container.querySelectorAll('.breaker-socket')).toHaveLength(4);

    fireEvent.click(screen.getByRole('button', { name: 'TERMINAL回路、OFF' }));
    expect(onSubmit).toHaveBeenCalledWith('puzzle_power_route', [
      'short-circuit',
      'terminal',
    ]);
    expect(
      screen.getByRole('button', { name: 'DOOR回路、ON' }),
    ).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'DOOR回路、ON' }));
    expect(screen.getByText('PROTECTION CLEAR')).toBeVisible();

    fireEvent.click(
      screen.getByRole('button', { name: 'ECHO BUFFER回路、OFF' }),
    );
    expect(onSubmit).toHaveBeenLastCalledWith('puzzle_power_route', [
      'control-signal-missing',
      'buffer',
    ]);
    expect(screen.getByText('CONTROL SIGNAL MISSING')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'ECHO BUFFER回路、OFF' }),
    ).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'TERMINAL回路、OFF' }));
    expect(screen.getByText('BOOT SEQUENCE / 1 / 3')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'INTERCOM回路、OFF' }));
    expect(screen.getByText('BOOT SEQUENCE / 2 / 3')).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', { name: 'ECHO BUFFER回路、OFF' }),
    );
    expect(screen.getByText('ONLINE')).toBeVisible();
    await waitFor(
      () =>
        expect(onSubmit).toHaveBeenLastCalledWith('puzzle_power_route', [
          'terminal',
          'intercom',
          'buffer',
        ]),
      { timeout: 1500 },
    );
    expect(screen.queryByText(/選択済み/)).not.toBeInTheDocument();
    expect(screen.queryByText('この答えで確認する')).not.toBeInTheDocument();
  });

  it('keeps the rejected switch logically off while the short is active', () => {
    const onSubmit = vi.fn();
    const view = render(
      <PuzzleDevice
        puzzleId="puzzle_power_route"
        failures={0}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    const device = within(view.container);
    fireEvent.click(device.getByRole('button', { name: 'TERMINAL回路、OFF' }));

    view.rerender(
      <PuzzleDevice
        puzzleId="puzzle_power_route"
        failures={1}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    expect(
      device.getByRole('button', { name: 'DOOR回路、ON' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      device.getByRole('button', { name: 'TERMINAL回路、OFF' }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(device.getByText('PROTECTION TRIPPED')).toBeVisible();
    expect(
      view.container.querySelector('.physical-breaker.is-rejected'),
    ).not.toBeNull();
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

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('FRAME RESTORED')).toBeInTheDocument();
    expect(screen.getByText(/PACKET 04/)).toHaveTextContent(
      '最後に、赤いボタンを押せ。',
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'ACCEPT FRAME / 復元内容を確認する',
      }),
    );
    expect(onSubmit).toHaveBeenCalledWith('puzzle_packet_repair', [
      'c',
      'd',
      'a',
      'b',
    ]);
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

    expect(screen.queryByText('4 STEP')).not.toBeInTheDocument();
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

  it('keeps dial input after a failed validation instead of remounting', () => {
    const onSubmit = vi.fn();
    const view = render(
      <PuzzleDevice
        puzzleId="puzzle_maintenance_lock"
        failures={0}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    const device = within(view.container);
    const firstDial = device.getByRole('spinbutton', { name: 'ダイヤル1' });
    fireEvent.click(firstDial);
    fireEvent.click(firstDial);
    fireEvent.click(device.getByRole('button', { name: 'LOCK HANDLE' }));
    const position = firstDial.getAttribute('aria-valuenow');

    view.rerender(
      <PuzzleDevice
        puzzleId="puzzle_maintenance_lock"
        failures={1}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    expect(
      device.getByRole('spinbutton', { name: 'ダイヤル1' }),
    ).toHaveAttribute('aria-valuenow', position);
    expect(device.getByText('LOCK / JAMMED')).toBeVisible();
  });

  it('keeps the 100.0% voice match visible until the player confirms it', () => {
    vi.useFakeTimers();
    const onSubmit = vi.fn();
    render(
      <PuzzleDevice
        embedded
        puzzleId="puzzle_voiceprint_calibration"
        failures={0}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole('spinbutton', { name: '波の間隔ダイヤル' }),
    );
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.change(screen.getByRole('slider', { name: '波の開始位置' }), {
      target: { value: '-2' },
    });
    act(() => vi.runAllTimers());

    expect(screen.getByText('100.0%')).toBeVisible();
    expect(screen.getByText('100.0% / MATCH / E-01 OCCUPANT')).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'MATCH CONFIRM / 本人一致を確認する',
      }),
    );
    expect(onSubmit).toHaveBeenCalledWith('puzzle_voiceprint_calibration', [
      'compress-half',
      'invert',
      'left-2',
    ]);
  });

  it('reports transmission failures by packet, delay, and route region', () => {
    const onSubmit = vi.fn();
    const view = render(
      <PuzzleDevice
        embedded
        puzzleId="puzzle_transmission_window"
        failures={1}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    const device = within(view.container);
    expect(device.getByText('PACKET MAP / RECHECK')).toBeVisible();
    expect(device.getByText('DELAY / RECHECK')).toBeVisible();
    expect(device.getByText('ROUTE / RECHECK')).toBeVisible();

    const packetLabels = [
      '……聞こえるか？',
      'まず電源を戻せ。',
      'ログは気にするな。',
      '最後に、赤いボタンを押せ。',
    ];
    const windows = [
      '返事をする前',
      '電源を調べる前',
      'LOGを開いた直後',
      '最後の操作の前',
    ];
    for (let index = 0; index < 4; index += 1) {
      fireEvent.click(
        device.getByRole('button', {
          name: `送信断片「${packetLabels[index]}」`,
        }),
      );
      fireEvent.click(
        device.getByRole('button', {
          name: new RegExp(`W${index + 1} ${windows[index]}`),
        }),
      );
    }
    expect(device.getByText('PACKET MAP / LOCKED')).toBeVisible();
    expect(device.getByText('DELAY / RECHECK')).toBeVisible();
    expect(device.getByText('ROUTE / RECHECK')).toBeVisible();
  });

  it('announces a session-only diagnostic after inactivity', () => {
    vi.useFakeTimers();
    const view = render(
      <PuzzleDevice
        embedded
        puzzleId="puzzle_carrier_sync"
        failures={0}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    act(() => vi.advanceTimersByTime(60_000));
    expect(
      within(view.container).getByText(/DIAGNOSTIC AVAILABLE/),
    ).toBeVisible();
  });
});
