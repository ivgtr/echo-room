import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PuzzleDevice } from '../../src/ui/puzzles/PuzzleDevice';
import { packetTexts } from '../../src/game/puzzles/storyPuzzles';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('PuzzleDevice', () => {
  it('keeps all restored PACKET subtitles visible until confirmation', () => {
    const onSubmit = vi.fn();
    render(
      <PuzzleDevice
        puzzleId="puzzle_packet_repair"
        failures={0}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.queryByText(`PACKET 04 / ${packetTexts[3]}`),
    ).not.toBeInTheDocument();
    for (const [index, fragment] of ['D', 'A', 'B'].entries()) {
      fireEvent.click(
        screen.getByRole('button', { name: `断片${fragment}を持つ` }),
      );
      fireEvent.click(
        screen.getByRole('button', {
          name: `レール${index + 2}へ断片${fragment}を置く`,
        }),
      );
    }
    for (const [index, text] of packetTexts.entries())
      expect(screen.getByText(`PACKET 0${index + 1} / ${text}`)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /NEXT PACKET|音声を再生/ }),
    ).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'ACCEPT FRAME / 復元内容を確認する' }),
    );
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('puzzle_packet_repair', [
      'c',
      'd',
      'a',
      'b',
    ]);
  });

  it('defers automatic detection for an inactive display and submits once when reactivated', () => {
    const onSubmit = vi.fn();
    const props = {
      puzzleId: 'puzzle_carrier_sync' as const,
      failures: 0,
      onSubmit,
      onClose: vi.fn(),
      embedded: true,
    };
    const view = render(<PuzzleDevice {...props} active={false} />);
    // Model an input update arriving at the visibility boundary.
    fireEvent.keyDown(screen.getByRole('slider', { name: 'CHANNEL A' }), {
      key: 'ArrowRight',
    });
    fireEvent.keyDown(screen.getByRole('slider', { name: 'CHANNEL A' }), {
      key: 'ArrowRight',
    });
    fireEvent.keyDown(screen.getByRole('slider', { name: 'CHANNEL C' }), {
      key: 'ArrowLeft',
    });
    expect(onSubmit).not.toHaveBeenCalled();
    view.rerender(<PuzzleDevice {...props} active />);
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('puzzle_carrier_sync', [
      'right-2',
      'none',
      'left-1',
    ]);
    view.rerender(<PuzzleDevice {...props} active={false} />);
    view.rerender(<PuzzleDevice {...props} active />);
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('keeps failed dial input and pauses the latch release when the page is hidden', () => {
    vi.useFakeTimers();
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
    fireEvent.click(device.getByRole('button', { name: 'ロッカーのハンドル' }));
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
    fireEvent.click(firstDial);
    for (let index = 2; index <= 4; index += 1)
      fireEvent.keyDown(
        device.getByRole('spinbutton', { name: `ダイヤル${index}` }),
        { key: 'ArrowUp' },
      );
    expect(device.queryByText('LOCK / JAMMED')).not.toBeInTheDocument();
    onSubmit.mockClear();
    fireEvent.click(device.getByRole('button', { name: 'ロッカーのハンドル' }));
    const hidden = vi.spyOn(document, 'hidden', 'get');
    hidden.mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));
    act(() => vi.advanceTimersByTime(600));
    expect(onSubmit).not.toHaveBeenCalled();
    hidden.mockReturnValue(false);
    fireEvent(document, new Event('visibilitychange'));
    act(() => vi.advanceTimersByTime(600));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
      'puzzle_maintenance_lock',
      ['double', 'ring', 'triangle', 'node'],
    );
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

    fireEvent.keyDown(
      screen.getByRole('slider', { name: '波の間隔ダイヤル' }),
      { key: 'ArrowLeft' },
    );
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.keyDown(screen.getByRole('slider', { name: '波の開始位置' }), {
      key: 'Home',
    });
    for (let step = 0; step < 7; step += 1)
      act(() => vi.advanceTimersByTime(600));

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

  it('requires time alignment and a continuous map trace, preserving it across hidden displays', () => {
    vi.useFakeTimers();
    const onSubmit = vi.fn();
    const props = {
      puzzleId: 'puzzle_signal_investigation' as const,
      failures: 0,
      onSubmit,
      onClose: vi.fn(),
      embedded: true,
    };
    const view = render(<PuzzleDevice {...props} />);
    for (const [receive, source] of [
      ['R1', 'S-B'],
      ['R2', 'S-C'],
      ['R3', 'S-A'],
    ]) {
      fireEvent.click(
        screen.getByRole('button', { name: `${receive}受信端子` }),
      );
      fireEvent.click(
        screen.getByRole('button', { name: `${source}送信端子` }),
      );
    }
    expect(screen.queryByText(/20:00 \/ LOCKED/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'INTERCOM端子' }),
    ).not.toBeInTheDocument();
    const ruler = screen.getByRole('slider', { name: '送信時刻ルーラー' });
    for (let step = 0; step < 4; step += 1)
      fireEvent.keyDown(ruler, { key: 'PageUp' });
    view.rerender(<PuzzleDevice {...props} active={false} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(
      screen.queryByRole('button', { name: 'INTERCOM端子' }),
    ).not.toBeInTheDocument();
    view.rerender(<PuzzleDevice {...props} active />);
    act(() => vi.advanceTimersByTime(500));
    // Keep the direction of the discovered offset readable during tracing.
    expect(screen.getByText('02:11:04')).toBeVisible();
    expect(screen.getByText('02:31:04')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'INTERCOM端子' }));
    fireEvent.click(screen.getByRole('button', { name: 'P-1端子' }));
    expect(screen.getByText('× SIGNAL LOST')).toBeVisible();
    for (const label of ['J-1端子', 'J-2端子', 'BUFFER端子'])
      fireEvent.click(screen.getByRole('button', { name: label }));
    expect(screen.getByText('RETURN / E-01')).toBeVisible();
    view.rerender(<PuzzleDevice {...props} active={false} />);
    act(() => vi.advanceTimersByTime(1200));
    expect(onSubmit).not.toHaveBeenCalled();
    view.rerender(<PuzzleDevice {...props} active />);
    const hidden = vi.spyOn(document, 'hidden', 'get');
    hidden.mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));
    act(() => vi.advanceTimersByTime(1200));
    expect(onSubmit).not.toHaveBeenCalled();
    hidden.mockReturnValue(false);
    fireEvent(document, new Event('visibilitychange'));
    act(() => vi.advanceTimersByTime(1200));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
      'puzzle_signal_investigation',
      ['s-b', 's-c', 's-a', 'signal', 'ring-relay', 'echo-buffer'],
    );
  });

  it('tests only complete causal mappings, retaining corrections across an interrupted pulse', () => {
    vi.useFakeTimers();
    const onSubmit = vi.fn();
    const props = {
      puzzleId: 'puzzle_transmission_window' as const,
      failures: 0,
      onSubmit,
      onClose: vi.fn(),
      embedded: true,
    };
    const view = render(<PuzzleDevice {...props} />);
    const lever = () =>
      screen.getByRole('button', { name: 'TEST PULSE 試験レバー' });
    expect(lever()).toBeDisabled();
    fireEvent.click(lever());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText(/四つの受信端子と送信ケーブルを接続/),
    ).toBeVisible();
    const scenes = [
      '受信後の返事',
      '指示に従った結果',
      'この直後に受信',
      '復元した文への反応',
    ];
    const place = (packet: number, scene: number) => {
      fireEvent.click(
        screen.getByRole('button', {
          name: `送信する文「${packetTexts[packet]}」`,
        }),
      );
      fireEvent.click(
        screen.getByRole('button', { name: new RegExp(`^${scenes[scene]}`) }),
      );
    };
    // A plausible but incorrect complete proposal must not certify each knob.
    for (const [scene, packet] of [1, 0, 2, 3].entries()) place(packet, scene);
    expect(lever()).toBeDisabled();
    expect(view.container).not.toHaveTextContent(/P0[1-4]|packet-0[1-4]/);
    expect(
      screen
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label'))
        .join(' '),
    ).not.toMatch(/P0[1-4]|packet-0[1-4]/);
    fireEvent.keyDown(screen.getByRole('slider', { name: '送信側の時間軸' }), {
      key: 'ArrowLeft',
    });
    fireEvent.click(screen.getByRole('button', { name: '送信ケーブルを持つ' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'ECHO BUFFER RETURNの端子' }),
    );
    expect(lever()).toBeEnabled();
    fireEvent.click(lever());
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(screen.getByText(/RECORD MISMATCH/)).toBeVisible();
    expect(view.container).not.toHaveTextContent(
      /TIME BASE \/ LOCKED|RETURN \/ LOCKED|P0[1-4]/,
    );
    act(() => vi.advanceTimersByTime(400));
    fireEvent.click(screen.getByRole('button', { name: /^指示に従った結果/ }));
    fireEvent.click(screen.getByRole('button', { name: /^受信後の返事/ }));
    place(1, 1);
    onSubmit.mockClear();
    fireEvent.click(lever());
    view.rerender(<PuzzleDevice {...props} active={false} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(onSubmit).not.toHaveBeenCalled();
    view.rerender(<PuzzleDevice {...props} active />);
    fireEvent.click(lever());
    fireEvent.click(lever());
    act(() => vi.advanceTimersByTime(1000));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
      'puzzle_transmission_window',
      [
        'packet-01',
        'packet-02',
        'packet-03',
        'packet-04',
        'minus-20',
        'echo-return',
      ],
    );
  });
});
