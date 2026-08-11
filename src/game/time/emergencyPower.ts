export const EMERGENCY_POWER_DURATION_MS = 19 * 60_000 + 48_000;
export const LOW_POWER_REMAINING_MS = 10 * 60_000;
export const CRITICAL_POWER_REMAINING_MS = 5 * 60_000;

export type EmergencyPowerPhase = 'normal' | 'low' | 'critical' | 'reserve';

export function getRemainingPowerMs(activeElapsedMs: number) {
  return Math.max(0, EMERGENCY_POWER_DURATION_MS - activeElapsedMs);
}

export function getEmergencyPowerPhase(
  activeElapsedMs: number,
): EmergencyPowerPhase {
  const remainingMs = getRemainingPowerMs(activeElapsedMs);
  if (remainingMs === 0) return 'reserve';
  if (remainingMs <= CRITICAL_POWER_REMAINING_MS) return 'critical';
  if (remainingMs <= LOW_POWER_REMAINING_MS) return 'low';
  return 'normal';
}

export function formatPowerTime(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}
