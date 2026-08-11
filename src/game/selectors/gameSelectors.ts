import type { SnapshotFrom } from 'xstate';

import { stagePuzzle, type StoryStage } from '../machine/gameMachine';
import type { gameMachine } from '../machine/gameMachine';

export type GameSnapshot = SnapshotFrom<typeof gameMachine>;

export const selectIsPlaying = (snapshot: GameSnapshot) =>
  snapshot.matches('playing');
export const selectIsIntro = (snapshot: GameSnapshot) =>
  snapshot.matches({ playing: 'intro' });
export const selectIsPowerPuzzle = (snapshot: GameSnapshot) =>
  snapshot.matches({ playing: 'breakerPuzzle' });
export const selectLocation = (snapshot: GameSnapshot) =>
  snapshot.context.locationId;
export const selectSelectedHotspot = (snapshot: GameSnapshot) =>
  snapshot.context.selectedHotspotId;
export const selectPowerRestored = (snapshot: GameSnapshot) =>
  snapshot.context.powerRestored;
export const selectIntroLineIndex = (snapshot: GameSnapshot) =>
  snapshot.context.introLineIndex;
export const selectTerminalMenu = (snapshot: GameSnapshot) =>
  snapshot.context.terminalMenuId;
export const selectStoryStage = (snapshot: GameSnapshot) =>
  snapshot.context.storyStage;
export const selectInventory = (snapshot: GameSnapshot) =>
  snapshot.context.inventory;
export const selectCompletedPuzzleIds = (snapshot: GameSnapshot) =>
  snapshot.context.completedPuzzleIds;
export const selectPuzzleFailures = (snapshot: GameSnapshot) =>
  snapshot.context.puzzleFailures;
export const selectEndingLineIndex = (snapshot: GameSnapshot) =>
  snapshot.context.endingLineIndex;
export const selectHintLevel = (snapshot: GameSnapshot) =>
  snapshot.context.hintLevel;
export const selectActiveElapsedMs = (snapshot: GameSnapshot) =>
  snapshot.context.activeElapsedMs;
export const selectReservePower = (snapshot: GameSnapshot) =>
  snapshot.context.reservePower;

const objectives: Partial<Record<StoryStage, string>> = {
  puzzle_carrier_sync: '端末のSYSTEMでECHO BUFFERの搬送波を同期する。',
  puzzle_maintenance_lock: '西壁の保守ロッカーを点検記号で開ける。',
  puzzle_log_pairing: '端末のLOGで波形指紋を照合する。',
  puzzle_signal_route: 'SECURITYの二層図から通信経路を追跡する。',
  puzzle_packet_repair: 'SIGNALで破損PACKETのフレームを復元する。',
  puzzle_temporal_anomaly: '復元PACKETと実際の出来事を照合する。',
  puzzle_voiceprint_calibration: '解析パネルで声紋特徴量を校正する。',
  puzzle_causal_script: 'SYSTEMで冒頭の因果会話を再構成する。',
  puzzle_transmission_window: '4つの受信窓へ送信計画を設定する。',
  transmission_ready: '試験を通過した送信計画を赤いボタンで実行する。',
};

export const selectObjective = (snapshot: GameSnapshot) => {
  if (!snapshot.matches('playing')) return null;
  if (snapshot.matches({ playing: 'powered' }))
    return objectives[snapshot.context.storyStage] ?? '脱出経路を確認する。';
  return '非常電源の損傷箇所と必要容量を調べ、給電経路を構成する。';
};

export const selectSubtitle = (snapshot: GameSnapshot) => {
  if (!snapshot.matches('playing')) return null;
  const hotspot = snapshot.context.selectedHotspotId;
  const stage = snapshot.context.storyStage;
  if (hotspot === 'hotspot_door')
    return stage === 'transmission_ready'
      ? 'ECHO TRANSMISSION COMPLETEを待機している。'
      : '非常ロックは通信完了信号と連動している。';
  if (hotspot === 'hotspot_intercom')
    return stage === 'puzzle_signal_route'
      ? '端子は環形。回線は設備壁の内部へ続いている。'
      : '発話音声ではなく、字幕と声紋特徴量を含むPACKETを受信している。';
  if (hotspot === 'hotspot_terminal' && !snapshot.context.powerRestored)
    return '端末には電源が来ていない。';
  if (
    hotspot === 'hotspot_analysis_panel' &&
    stage !== 'puzzle_voiceprint_calibration'
  )
    return '解析パネルは職員記録との照合に使う。今は必要な資料が足りない。';
  if (hotspot === 'hotspot_locker' && stage !== 'puzzle_maintenance_lock')
    return snapshot.context.inventory.length > 0
      ? '保守ロッカーは開いている。必要な物は回収済みだ。'
      : '数字盤ではなく、四つの保守記号を設定する錠だ。';
  return null;
};

export const selectCurrentPuzzleId = (snapshot: GameSnapshot) => {
  if (snapshot.matches({ playing: 'breakerPuzzle' }))
    return 'puzzle_power_route' as const;
  return stagePuzzle[snapshot.context.storyStage] ?? null;
};
