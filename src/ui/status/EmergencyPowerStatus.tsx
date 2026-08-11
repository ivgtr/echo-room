import {
  formatPowerTime,
  getEmergencyPowerPhase,
  getRemainingPowerMs,
  type EmergencyPowerPhase,
} from '../../game/time/emergencyPower';

type Props = {
  activeElapsedMs: number;
  powerRestored: boolean;
  reservePower?: boolean;
  paused?: boolean;
};

const phaseLabels: Record<EmergencyPowerPhase, string | null> = {
  normal: null,
  low: 'LOW POWER / 残量10分以下',
  critical: 'CRITICAL / 電圧低下・残量5分以下',
  reserve: 'RESERVE POWER / 予備電源稼働中',
};

export function EmergencyPowerStatus({
  activeElapsedMs,
  powerRestored,
  reservePower = false,
  paused = false,
}: Props) {
  const phase = reservePower
    ? 'reserve'
    : getEmergencyPowerPhase(activeElapsedMs);
  const phaseLabel = phaseLabels[phase];
  const remainingMs = reservePower ? 0 : getRemainingPowerMs(activeElapsedMs);

  return (
    <div className="emergency-status" data-power-phase={phase}>
      <span>
        {powerRestored ? 'MAIN POWER ONLINE' : 'EMERGENCY LOCK'}
        {paused ? ' / PAUSED' : ''}
      </span>
      <strong>
        <span>BATTERY</span> <time>{formatPowerTime(remainingMs)}</time>
      </strong>
      {phaseLabel && (
        <span className="emergency-phase" role="status">
          {phaseLabel}
        </span>
      )}
    </div>
  );
}
