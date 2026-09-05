import { useState } from 'react';
import {
  act,
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

const failures = Object.fromEntries(puzzleIds.map((id) => [id, 0])) as Record<
  PuzzleId,
  number
>;

function propsFor(stage: StoryStage) {
  const index = puzzleIds.indexOf(stage as PuzzleId);
  return {
    stage,
    completedPuzzleIds:
      stage === 'transmission_ready'
        ? [...puzzleIds]
        : puzzleIds.slice(0, index),
    puzzleFailures: failures,
    onSelect: vi.fn(),
    onClose: vi.fn(),
    onPuzzleSubmit: vi.fn(),
    onTransmit: vi.fn(),
  };
}

function Session({
  stage,
  initialMode = 'system',
}: {
  stage: StoryStage;
  initialMode?: TerminalMenuId;
}) {
  const [menuId, onSelect] = useState(initialMode);
  return (
    <TerminalPanel {...propsFor(stage)} menuId={menuId} onSelect={onSelect} />
  );
}

const modeButton = (name: string) => screen.getByRole('button', { name });
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('TerminalPanel', () => {
  it('stops diagnostic timers while another display is selected without losing adjustments', () => {
    vi.useFakeTimers();
    render(<Session stage="puzzle_carrier_sync" />);
    fireEvent.keyDown(screen.getByRole('slider', { name: 'CHANNEL A' }), {
      key: 'ArrowRight',
    });
    act(() => vi.advanceTimersByTime(30_000));
    fireEvent.click(modeButton('LOG'));
    act(() => vi.advanceTimersByTime(120_000));
    fireEvent.click(modeButton('SYSTEM'));
    expect(screen.queryByText(/DIAGNOSTIC AVAILABLE/)).not.toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'CHANNEL A' })).toHaveAttribute(
      'aria-valuenow',
      '-1',
    );
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByText(/DIAGNOSTIC AVAILABLE/)).toBeVisible();
  });

  it('keeps the untraced route description consistent for assistive technology', () => {
    const view = render(
      <TerminalPanel
        {...propsFor('puzzle_signal_investigation')}
        menuId="security"
      />,
    );
    expect(screen.getByRole('img', { name: /未追跡の配線候補/ })).toBeVisible();
    expect(
      screen.queryByRole('img', { name: /帰還経路確認済み/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/通信線はJ-2を通り/)).not.toBeInTheDocument();
    view.rerender(
      <TerminalPanel {...propsFor('puzzle_packet_repair')} menuId="security" />,
    );
    expect(screen.getByRole('img', { name: /帰還経路確認済み/ })).toBeVisible();
    expect(screen.getByText(/通信線はJ-2を通り/)).toBeVisible();
  });

  it('puts one puzzle surface in the terminal glass and its mode keys on the bezel', () => {
    const { container } = render(
      <TerminalPanel {...propsFor('puzzle_carrier_sync')} menuId="system" />,
    );
    expect(screen.getByRole('heading', { name: '波形調整' })).toBeVisible();
    expect(container.querySelector('.terminal-chassis')).toHaveAttribute(
      'src',
      expect.stringContaining('gfx-close-008__off__preview-flat.webp'),
    );
    expect(
      container.querySelector('.terminal-glass .device-identity'),
    ).toBeNull();
    expect(
      container.querySelector('.terminal-glass .terminal-function-keys'),
    ).toBeNull();
    expect(screen.getByRole('group', { name: '端末の表示切替' })).toBeVisible();
    expect(modeButton('SYSTEM')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.getByText('TERMINAL ║')).toBeVisible();
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
    expect(
      screen.queryByText(/早い波は右|この答えで確認する|選択済み/),
    ).not.toBeInTheDocument();
  });

  it('preserves adjustments without exposing the hidden device to keyboard navigation', () => {
    render(<Session stage="puzzle_carrier_sync" />);
    fireEvent.keyDown(screen.getByRole('slider', { name: 'CHANNEL A' }), {
      key: 'ArrowRight',
    });
    fireEvent.click(modeButton('LOG'));
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    fireEvent.click(modeButton('SYSTEM'));
    expect(screen.getByRole('slider', { name: 'CHANNEL A' })).toHaveAttribute(
      'aria-valuenow',
      '-1',
    );
  });

  it('retains matched records and the unfinished trace when inspecting another display', () => {
    const { container } = render(
      <Session stage="puzzle_signal_investigation" initialMode="log" />,
    );
    for (const [receive, source] of [
      ['R1', 'S-B'],
      ['R2', 'S-C'],
      ['R3', 'S-A'],
    ]) {
      fireEvent.click(modeButton(`${receive}受信端子`));
      fireEvent.click(modeButton(`${source}送信端子`));
    }
    expect(screen.getByText('+20:00 / OFFSET CONFIRMED')).toBeVisible();
    fireEvent.click(modeButton('通信実線'));
    fireEvent.click(modeButton('SECURITY'));
    expect(screen.getByText('ROUTE / NOT TRACED — 経路未確認')).toBeVisible();
    expect(screen.queryByText('ECHO BUFFER RETURN ○')).not.toBeInTheDocument();
    const ids = Array.from(
      container.querySelectorAll('[id]'),
      (element) => element.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    fireEvent.click(modeButton('LOG'));
    expect(screen.getByText('R1 ─ S-B')).toBeVisible();
    expect(modeButton('通信実線')).toHaveAttribute('aria-pressed', 'true');
    expect(modeButton('J-2 丸端子')).toBeEnabled();
  });

  it('retains a placed frame fragment and send settings across mode changes', () => {
    const frame = render(
      <Session stage="puzzle_packet_repair" initialMode="audio" />,
    );
    fireEvent.click(modeButton('断片Dを持つ'));
    fireEvent.click(modeButton('レール2へ断片Dを置く'));
    fireEvent.click(modeButton('LOG'));
    fireEvent.click(modeButton('SIGNAL'));
    expect(modeButton('レール2の断片Dを持ち上げる')).toBeVisible();
    frame.unmount();
    render(<Session stage="puzzle_transmission_window" />);
    fireEvent.click(screen.getByRole('spinbutton', { name: '時間差ダイヤル' }));
    fireEvent.click(modeButton('LOG'));
    fireEvent.click(modeButton('SYSTEM'));
    expect(
      screen.getByRole('spinbutton', { name: '時間差ダイヤル' }),
    ).toHaveTextContent('-00:20:00');
  });

  it('keeps the terminal nameplate and the local maintenance status available', () => {
    render(
      <TerminalPanel
        {...propsFor('puzzle_maintenance_lock')}
        menuId="system"
      />,
    );
    expect(screen.getByText('TERMINAL ║')).toBeVisible();
    expect(
      screen.getByText('WEST MAINTENANCE LOCK / LOCAL CONTROL'),
    ).toBeVisible();
    expect(screen.queryByText('ロッカーの記号錠')).not.toBeInTheDocument();
  });

  it('does not expose routes before access, or exact delay before the investigation', () => {
    const view = render(
      <TerminalPanel
        {...propsFor('puzzle_maintenance_lock')}
        menuId="security"
      />,
    );
    expect(screen.getByText('ACCESS / STAFF CARD REQUIRED')).toBeVisible();
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
    view.rerender(
      <TerminalPanel
        {...propsFor('puzzle_signal_investigation')}
        menuId="system"
      />,
    );
    expect(screen.getByText('--:--:-- / CALIBRATION ERROR')).toBeVisible();
    expect(screen.queryByText('-00:20:00')).not.toBeInTheDocument();
    expect(screen.queryByText('ECHO BUFFER RETURN ○')).not.toBeInTheDocument();
    expect(screen.queryByText('FRAME')).not.toBeInTheDocument();
  });

  it('archives measured pairs and the verified route after the investigation', () => {
    const view = render(
      <TerminalPanel {...propsFor('puzzle_packet_repair')} menuId="log" />,
    );
    const records = within(screen.getByRole('table'));
    expect(records.getByText('R1 / 02:11:04')).toBeVisible();
    expect(records.getByText('S-B / 02:31:04')).toBeVisible();
    expect(records.getByText('短・長・短')).toBeVisible();
    expect(screen.getByText('+20:00 / OFFSET CONFIRMED')).toBeVisible();
    view.rerender(
      <TerminalPanel {...propsFor('puzzle_packet_repair')} menuId="security" />,
    );
    expect(screen.getByText('ECHO BUFFER RETURN ○')).toBeVisible();
    expect(screen.getByText('RETURN BUS / TRACE VERIFIED')).toBeVisible();
  });

  it('reveals restored packet text and voice identity only after their respective discoveries', () => {
    const view = render(
      <TerminalPanel
        {...propsFor('puzzle_signal_investigation')}
        menuId="audio"
      />,
    );
    expect(screen.queryByText(packetTexts[3]!)).not.toBeInTheDocument();
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

  it.each(puzzleIds.slice(1))(
    'keeps the red control inhibited during %s',
    (stage) => {
      const props = propsFor(stage as StoryStage);
      render(<TerminalPanel {...props} menuId="system" />);
      expect(modeButton('赤い送信ボタンを押す')).toBeDisabled();
      fireEvent.click(modeButton('赤い送信ボタンを押す'));
      expect(props.onTransmit).not.toHaveBeenCalled();
      expect(
        screen.queryByText(/PUZZLES VERIFIED|確認完了：|7 \/ 7/),
      ).not.toBeInTheDocument();
    },
  );

  it('releases the same guarded control after verification and transmits only once', () => {
    const props = propsFor('transmission_ready');
    const { container } = render(<TerminalPanel {...props} menuId="system" />);
    expect(screen.getByText('READY / 送信可')).toBeVisible();
    expect(screen.getByText('TRANSMIT / INTERLOCK RELEASED')).toBeVisible();
    expect(screen.getByText('-00:20:00')).toBeVisible();
    expect(screen.getByText('ECHO BUFFER RETURN')).toBeVisible();
    expect(
      screen.getByRole('list', { name: '送信パケット4枠' }),
    ).toHaveTextContent(packetTexts[0]!);
    expect(
      container.querySelector('.terminal-glass .terminal-transmit-button'),
    ).toBeNull();
    expect(
      screen.queryByText(/PUZZLES VERIFIED|確認完了：|7 \/ 7/),
    ).not.toBeInTheDocument();
    fireEvent.click(modeButton('赤い送信ボタンを押す'));
    fireEvent.click(modeButton('赤い送信ボタンを押す'));
    expect(props.onTransmit).toHaveBeenCalledOnce();
  });

  it('signals only an actual mode change and retains the shared BACK action', () => {
    const props = propsFor('puzzle_carrier_sync');
    const { container } = render(<TerminalPanel {...props} menuId="system" />);
    fireEvent.click(modeButton('SYSTEM'));
    expect(props.onSelect).not.toHaveBeenCalled();
    expect(container.querySelector('.is-switching')).toBeNull();
    fireEvent.click(modeButton('LOG'));
    expect(props.onSelect).toHaveBeenCalledExactlyOnceWith('log');
    expect(container.querySelector('.terminal-scan')).toHaveClass(
      'is-switching',
    );
    fireEvent.click(screen.getByRole('button', { name: /BACK/ }));
    expect(props.onClose).toHaveBeenCalledOnce();
  });
});
