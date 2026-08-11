import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EMERGENCY_POWER_DURATION_MS } from '../../src/game/time/emergencyPower';
import { EmergencyPowerStatus } from '../../src/ui/status/EmergencyPowerStatus';

describe('EmergencyPowerStatus', () => {
  it('shows a textual critical warning without relying on color', () => {
    const { container } = render(
      <EmergencyPowerStatus
        activeElapsedMs={EMERGENCY_POWER_DURATION_MS - 5 * 60_000}
        powerRestored
      />,
    );
    expect(screen.getByText('00:05:00')).toBeVisible();
    expect(within(container).getByRole('status')).toHaveTextContent(
      'CRITICAL / 電圧低下・残量5分以下',
    );
  });

  it('states that reserve power keeps the facility active', () => {
    const { container } = render(
      <EmergencyPowerStatus
        activeElapsedMs={10}
        powerRestored
        reservePower
        paused
      />,
    );
    expect(screen.getByText(/MAIN POWER ONLINE \/ PAUSED/)).toBeVisible();
    expect(within(container).getByRole('status')).toHaveTextContent(
      'RESERVE POWER / 予備電源稼働中',
    );
  });
});
