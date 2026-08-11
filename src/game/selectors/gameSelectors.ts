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
  puzzle_carrier_sync: '端末のSYSTEMで、A・B・Cの波のずれを直す。',
  puzzle_maintenance_lock: '西壁のロッカーを、4つの記号で開ける。',
  puzzle_log_pairing: '端末のLOGで、同じ形の通信を組み合わせる。',
  puzzle_signal_route: 'SECURITYの配線図で、通信線の行き先を調べる。',
  puzzle_packet_repair: 'SIGNALで、壊れたPACKETをつなぎ直す。',
  puzzle_temporal_anomaly: '4つの発言から、未来を知っているものを探す。',
  puzzle_voiceprint_calibration:
    '解析パネルで、受信データを職員記録に合わせる。',
  puzzle_causal_script: 'SYSTEMで、4つの発言を正しい順に並べる。',
  puzzle_transmission_window: '4つの発言を、20分前へ送る準備をする。',
  transmission_ready: 'SYSTEMで送る内容を確認し、赤いボタンを押す。',
};

export const selectObjective = (snapshot: GameSnapshot) => {
  if (!snapshot.matches('playing')) return null;
  if (snapshot.matches({ playing: 'powered' }))
    return objectives[snapshot.context.storyStage] ?? '脱出経路を確認する。';
  return 'デスクで容量と壊れた線を調べ、ブレーカーをつなぐ。';
};

export const selectSubtitle = (snapshot: GameSnapshot) => {
  if (!snapshot.matches('playing')) return null;
  const hotspot = snapshot.context.selectedHotspotId;
  const stage = snapshot.context.storyStage;
  if (hotspot === 'hotspot_door')
    return stage === 'transmission_ready'
      ? '送信が終われば、ドアのロックが外れるはずだ。'
      : '非常ロックがかかっている。通信が終わるまで開かない。';
  if (hotspot === 'hotspot_intercom')
    return stage === 'puzzle_signal_route'
      ? '丸い端子から、通信線が設備壁の中へ続いている。'
      : '音声は流れない。文章と声紋データがPACKETで届いている。';
  if (hotspot === 'hotspot_terminal' && !snapshot.context.powerRestored)
    return '端末には電源が来ていない。';
  if (
    hotspot === 'hotspot_analysis_panel' &&
    stage !== 'puzzle_voiceprint_calibration'
  )
    return '受信データと職員記録を比べる装置だ。今はまだ使えない。';
  if (hotspot === 'hotspot_locker' && stage !== 'puzzle_maintenance_lock')
    return snapshot.context.inventory.length > 0
      ? '保守ロッカーは開いている。必要な物は回収済みだ。'
      : '数字ではなく、4つの機器記号で開ける錠だ。';
  return null;
};

export const selectCurrentPuzzleId = (snapshot: GameSnapshot) => {
  if (snapshot.matches({ playing: 'breakerPuzzle' }))
    return 'puzzle_power_route' as const;
  return stagePuzzle[snapshot.context.storyStage] ?? null;
};
