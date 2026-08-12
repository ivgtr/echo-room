import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { InspectionEvidencePanel } from '../../src/ui/evidence/InspectionEvidencePanel';

describe('InspectionEvidencePanel', () => {
  it('composites the stopped 02:17 clock as accessible HTML', () => {
    const onClose = vi.fn();
    render(<InspectionEvidencePanel kind="clock" onClose={onClose} />);
    expect(screen.getByRole('dialog')).toHaveClass('clock-evidence-modal');
    expect(screen.getByText('02:17')).toHaveAttribute('datetime', '02:17');
    expect(
      screen.getByText(/バッテリーの残り時間を示す時計ではない/),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders the isolation and upstream recovery principle on the desk paper', () => {
    render(<InspectionEvidencePanel kind="desk" onClose={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: '補助回路復旧手順' }),
    ).toBeVisible();
    expect(screen.getByText(/異常回線を隔離/)).toBeVisible();
    expect(screen.getByText(/SOURCE — RELAY — TERMINATOR/)).toBeVisible();
  });

  it('changes the desk document as the investigation advances', () => {
    const { rerender } = render(
      <InspectionEvidencePanel
        kind="desk"
        powerRestored
        stage="puzzle_carrier_sync"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: '同期調整メモ' })).toBeVisible();
    expect(screen.getByText(/DELAY \/ 右へ/)).toBeVisible();

    rerender(
      <InspectionEvidencePanel
        kind="desk"
        powerRestored
        stage="puzzle_maintenance_lock"
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('heading', { name: '夜勤の覚え書き' }),
    ).toBeVisible();
    expect(screen.getByText(/端末の記録を閉じ、通話器を戻す/)).toBeVisible();
    expect(screen.queryByText(/ロッカーには/)).not.toBeInTheDocument();
  });
});
