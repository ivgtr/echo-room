import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InspectionEvidencePanel } from '../../src/ui/evidence/InspectionEvidencePanel';

afterEach(cleanup);

describe('InspectionEvidencePanel', () => {
  it('composites the stopped 02:17 clock as accessible HTML', () => {
    const onClose = vi.fn();
    render(<InspectionEvidencePanel kind="clock" onClose={onClose} />);
    expect(screen.getByRole('dialog')).toHaveClass('clock-evidence-modal');
    expect(screen.getByText('02:17')).toHaveAttribute('datetime', '02:17');
    expect(
      screen.getByText(/バッテリーの残り時間を示す時計ではない/),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'BACK / 戻る' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows every desk item from the first inspection', () => {
    render(
      <InspectionEvidencePanel
        kind="desk"
        powerRestored={false}
        completedPuzzleIds={[]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toHaveClass('desk-evidence-modal');
    expect(screen.getByRole('heading', { name: '机の上' })).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: '折り目のついた引き継ぎメモを調べる',
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: '方眼紙に書かれた波形の走り書きを調べる',
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: '書き込みのある夜勤チェック表を調べる',
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: '交代勤務の小さな付箋を調べる' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: '端が破れた買い物メモを調べる' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: 'メモの下からのぞく作業写真を調べる',
      }),
    ).toBeVisible();
    expect(screen.queryByText('読む')).not.toBeInTheDocument();
    expect(screen.getByText('夜間勤務 / 引継事項')).toBeVisible();
    expect(screen.getByText('夜勤終了チェック')).toBeVisible();
  });

  it('opens individual notes and returns focus to their position on the desk', async () => {
    render(
      <InspectionEvidencePanel
        kind="desk"
        powerRestored={false}
        completedPuzzleIds={[]}
        onClose={vi.fn()}
      />,
    );
    const handover = screen.getByRole('button', {
      name: '折り目のついた引き継ぎメモを調べる',
    });
    fireEvent.click(handover);

    expect(
      screen.getByRole('heading', { name: '朝番への引き継ぎ' }),
    ).toBeVisible();
    expect(screen.getByText(/焦げ臭い回路は無理に戻さない/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'DESK / 机に戻る' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: '折り目のついた引き継ぎメモを調べる',
        }),
      ).toHaveFocus(),
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'メモの下からのぞく作業写真を調べる',
      }),
    );
    expect(screen.getByRole('heading', { name: '作業中の写真' })).toBeVisible();
    expect(
      screen.getByRole('img', { name: '端末に向かう、後ろ姿の作業員' }),
    ).toBeVisible();
  });

  it('keeps the paper fixed while the protagonist interpretation changes', () => {
    const { rerender } = render(
      <InspectionEvidencePanel
        kind="desk"
        powerRestored={false}
        completedPuzzleIds={[]}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: '方眼紙に書かれた波形の走り書きを調べる',
      }),
    );
    expect(screen.getByText(/今はまだ分からない/)).toBeVisible();
    expect(screen.getByText(/先走った波は右へ待たせる/)).toBeVisible();

    rerender(
      <InspectionEvidencePanel
        kind="desk"
        powerRestored
        completedPuzzleIds={['puzzle_carrier_sync']}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/波形を合わせるための走り書きだった/),
    ).toBeVisible();
    expect(screen.getByText(/先走った波は右へ待たせる/)).toBeVisible();
  });
});
