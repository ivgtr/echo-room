import type { LocationId } from '../../game/domain/ids';
import type { PuzzleId } from '../../game/puzzles/storyPuzzles';

// A visual projection of established progress, never additional saved state.
export function getWorldDeviceState(completed: readonly PuzzleId[]) {
  return {
    carrier: completed.includes('puzzle_carrier_sync'),
    locker: completed.includes('puzzle_maintenance_lock'),
    returnBus: completed.includes('puzzle_signal_investigation'),
    frame: completed.includes('puzzle_packet_repair'),
    identity: completed.includes('puzzle_voiceprint_calibration'),
    transmit: completed.includes('puzzle_transmission_window'),
  };
}

export type WorldDeviceState = ReturnType<typeof getWorldDeviceState>;

export function describeWorldDevices(
  locationId: LocationId,
  state: WorldDeviceState,
) {
  if (locationId === 'location_west_wall') {
    if (state.locker) return 'ロッカーのラッチが外れている';
    if (state.carrier) return 'ロッカーの三つの同期灯が点灯している';
  }
  if (locationId === 'location_east_wall') {
    if (state.transmit) return '端末の送信回路がつながり、送信灯が点灯している';
    if (state.identity) return '端末と照合パネルに同じ波形が固定されている';
    if (state.frame) return '端末で四つの通信データがつながっている';
    if (state.returnBus) return '端末の帰還回路が一周つながっている';
    if (state.carrier) return '端末の三回線が同期している';
  }
  return '';
}
