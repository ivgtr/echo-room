import { describe, expect, it } from 'vitest';

import {
  CRITICAL_POWER_REMAINING_MS,
  EMERGENCY_POWER_DURATION_MS,
  formatPowerTime,
  getEmergencyPowerPhase,
  getRemainingPowerMs,
  LOW_POWER_REMAINING_MS,
} from '../../src/game/time/emergencyPower';

describe('emergencyPower', () => {
  it('formats the initial battery and clamps exhausted time at zero', () => {
    expect(formatPowerTime(EMERGENCY_POWER_DURATION_MS)).toBe('00:19:48');
    expect(formatPowerTime(-1)).toBe('00:00:00');
    expect(getRemainingPowerMs(EMERGENCY_POWER_DURATION_MS + 1)).toBe(0);
  });

  it('uses inclusive ten- and five-minute warning thresholds', () => {
    expect(
      getEmergencyPowerPhase(
        EMERGENCY_POWER_DURATION_MS - LOW_POWER_REMAINING_MS - 1,
      ),
    ).toBe('normal');
    expect(
      getEmergencyPowerPhase(
        EMERGENCY_POWER_DURATION_MS - LOW_POWER_REMAINING_MS,
      ),
    ).toBe('low');
    expect(
      getEmergencyPowerPhase(
        EMERGENCY_POWER_DURATION_MS - CRITICAL_POWER_REMAINING_MS,
      ),
    ).toBe('critical');
    expect(getEmergencyPowerPhase(EMERGENCY_POWER_DURATION_MS)).toBe('reserve');
  });
});
