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
    render(<InspectionEvidencePanel kind="desk" onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toHaveClass('desk-evidence-modal');
    expect(screen.getByRole('heading', { name: '机の上' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: '折り目のついた引き継ぎメモを読む' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: '波形の走り書きを読む' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: '夜勤の覚え書きを読む' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: '交代勤務の伝言を読む' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: '小さな買い物メモを読む' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: '伏せかけの作業写真を読む' }),
    ).toBeVisible();
  });

  it('opens individual notes and returns focus to their position on the desk', async () => {
    render(<InspectionEvidencePanel kind="desk" onClose={vi.fn()} />);
    const handover = screen.getByRole('button', {
      name: '折り目のついた引き継ぎメモを読む',
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
          name: '折り目のついた引き継ぎメモを読む',
        }),
      ).toHaveFocus(),
    );

    fireEvent.click(
      screen.getByRole('button', { name: '伏せかけの作業写真を読む' }),
    );
    expect(screen.getByRole('heading', { name: '作業中の写真' })).toBeVisible();
    expect(
      screen.getByRole('img', { name: '端末に向かう、後ろ姿の作業員' }),
    ).toBeVisible();
  });
});
