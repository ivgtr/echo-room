import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TerminalPanel } from '../../src/ui/terminal/TerminalPanel';

describe('TerminalPanel', () => {
  it('shows exact story times and keeps future menus locked', () => {
    const onSelect = vi.fn();
    render(
      <TerminalPanel
        menuId="system"
        stage="inspect_logs"
        finalReady={false}
        onSelect={onSelect}
        onClose={vi.fn()}
        onLogsConfirmed={vi.fn()}
        onMapInspected={vi.fn()}
        onPacketPlayed={vi.fn()}
        onFinalSubmit={vi.fn()}
        onTransmit={vi.fn()}
      />,
    );
    expect(screen.getByText('-00:20:00')).toBeVisible();
    expect(screen.getByText('02:17')).toBeVisible();
    expect(screen.getByText('02:37')).toBeVisible();
    expect(
      screen.getByText('緊急時は「送信側の時刻」を使用する。'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: /AUDIO/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'LOG' }));
    expect(onSelect).toHaveBeenCalledWith('log');
  });

  it('authenticates the staff card before showing the exact facility map', () => {
    const onMapInspected = vi.fn();
    render(
      <TerminalPanel
        menuId="security"
        stage="reveal_no_adjacent_room"
        finalReady={false}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onLogsConfirmed={vi.fn()}
        onMapInspected={onMapInspected}
        onPacketPlayed={vi.fn()}
        onFinalSubmit={vi.fn()}
        onTransmit={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: /ACCESS CARD 職員用カードを選択して図面を確認/,
      }),
    );
    expect(onMapInspected).toHaveBeenCalledOnce();
    expect(
      screen.getByText(
        'E-01の左右は機械設備とコンクリート壁。隣室は存在しない。',
      ),
    ).toBeVisible();
  });

  it('shows exactly four final packet slots and the negative-delay target', () => {
    const onFinalSubmit = vi.fn();
    const { container } = render(
      <TerminalPanel
        menuId="system"
        stage="transmit_packets"
        finalReady={false}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onLogsConfirmed={vi.fn()}
        onMapInspected={vi.fn()}
        onPacketPlayed={vi.fn()}
        onFinalSubmit={onFinalSubmit}
        onTransmit={vi.fn()}
      />,
    );
    const view = within(container);
    const slots = view.getByRole('list', { name: '送信パケット4枠' });
    expect(slots.children).toHaveLength(4);
    expect(view.getAllByText('EMPTY / 未設定')).toHaveLength(4);
    expect(view.getAllByText('-00:20:00')).toHaveLength(1);
    for (const text of [
      '……聞こえるか？',
      'まず電源を戻せ。',
      'ログは気にするな。',
      '最後に、赤いボタンを押せ。',
    ]) {
      fireEvent.click(view.getByRole('button', { name: new RegExp(text) }));
    }
    fireEvent.click(view.getByRole('button', { name: '4枠を設定' }));
    expect(onFinalSubmit).toHaveBeenCalledWith([
      'audio_packet_01',
      'audio_packet_02',
      'audio_packet_03',
      'audio_packet_04',
    ]);
  });
});
