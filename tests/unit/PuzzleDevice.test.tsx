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
});
