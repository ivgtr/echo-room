import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { InspectionEvidencePanel } from '../../src/ui/evidence/InspectionEvidencePanel';

describe('InspectionEvidencePanel', () => {
  it('composites the stopped 02:17 clock as accessible HTML', () => {
    const onClose = vi.fn();
    render(<InspectionEvidencePanel kind="clock" onClose={onClose} />);
    expect(screen.getByRole('dialog')).toHaveClass('clock-evidence-modal');
    expect(screen.getByText('02:17')).toHaveAttribute('datetime', '02:17');
    expect(screen.getByText(/バッテリー残量とは別/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders the exact emergency power instruction on the desk paper', () => {
    render(<InspectionEvidencePanel kind="power-test" onClose={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: 'EMERGENCY POWER TEST' }),
    ).toBeVisible();
    expect(screen.getByText('周波数の低い回路から接続すること')).toBeVisible();
  });
});
