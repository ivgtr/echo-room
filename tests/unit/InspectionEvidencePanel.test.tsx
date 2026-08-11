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

  it('renders the capacity and fault evidence on the desk paper', () => {
    render(<InspectionEvidencePanel kind="desk" onClose={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: '非常電源配分表' }),
    ).toBeVisible();
    expect(screen.getByText(/TERMINAL 2.*INTERCOM 1/)).toBeVisible();
    expect(screen.getByText(/SHORT DETECTED/)).toBeVisible();
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
    expect(screen.getByRole('heading', { name: '夜間点検順' })).toBeVisible();
    expect(
      screen.getByText('TERMINAL → INTERCOM → ECHO BUFFER → DOOR'),
    ).toBeVisible();
  });
});
