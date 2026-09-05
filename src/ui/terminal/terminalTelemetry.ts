import type {
  StoryStage,
  TerminalMenuId,
} from '../../game/machine/gameMachine';
import { stagePuzzle } from '../../game/machine/gameMachine';
import type { PuzzleId } from '../../game/puzzles/storyPuzzles';

export const terminalModes = [
  { id: 'system', label: 'SYSTEM', caption: '設備・送信' },
  { id: 'log', label: 'LOG', caption: '通信記録' },
  { id: 'audio', label: 'SIGNAL', caption: '受信データ' },
  { id: 'security', label: 'SECURITY', caption: '施設配線' },
] as const;

const puzzleModes: Partial<Record<PuzzleId, TerminalMenuId>> = {
  puzzle_carrier_sync: 'system',
  puzzle_signal_investigation: 'log',
  puzzle_packet_repair: 'audio',
  puzzle_transmission_window: 'system',
};

const stageStatus: Partial<Record<StoryStage, string>> = {
  puzzle_carrier_sync: 'CARRIER / NO LOCK',
  puzzle_maintenance_lock: 'WEST MAINTENANCE LOCK / LOCAL CONTROL',
  puzzle_signal_investigation: 'LOG / RECORDS AVAILABLE',
  puzzle_packet_repair: 'SIGNAL / DAMAGED FRAME DETECTED',
  puzzle_voiceprint_calibration: 'VOICEPRINT DATA / EXTERNAL PANEL',
  puzzle_transmission_window: 'TRANSMIT / INTERLOCK ENGAGED',
  transmission_ready: 'TRANSMIT / INTERLOCK RELEASED',
};

// A read-only projection of game progress; never a second progression machine.
export function getTerminalTelemetry(
  stage: StoryStage,
  completed: readonly PuzzleId[],
) {
  const has = (id: PuzzleId) => completed.includes(id);
  const investigated = has('puzzle_signal_investigation');
  const frameRestored = has('puzzle_packet_repair');
  const recordsAvailable = has('puzzle_maintenance_lock');
  const voiceMatched = has('puzzle_voiceprint_calibration');
  const puzzleId = stagePuzzle[stage];
  const puzzleMode = puzzleId ? puzzleModes[puzzleId] : undefined;
  const transmissionReady = stage === 'transmission_ready';
  const readings = [
    {
      label: 'CARRIER',
      value: has('puzzle_carrier_sync') ? 'LOCKED' : 'NO LOCK',
    },
    { label: 'LOCAL CLOCK', value: '02:17 / STOPPED' },
    {
      label: 'NEGATIVE DELAY',
      value: investigated ? '-00:20:00' : '--:--:-- / CALIBRATION ERROR',
    },
  ];
  if (investigated) {
    readings.push(
      { label: 'RETURN BUS', value: 'ECHO BUFFER RETURN' },
      { label: 'FRAME', value: frameRestored ? 'RESTORED' : 'DAMAGED' },
    );
  }
  if (frameRestored)
    readings.push({
      label: 'VOICEPRINT',
      value: voiceMatched ? 'MATCH / E-01 OCCUPANT' : 'AWAITING CALIBRATION',
    });

  return {
    puzzleId: puzzleMode ? puzzleId : undefined,
    puzzleMode,
    recordsAvailable,
    investigated,
    frameRestored,
    voiceMatched,
    transmissionReady,
    readings,
    status: stageStatus[stage] ?? 'TRANSMISSION BUS / STANDBY',
  };
}
