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
  puzzle_carrier_sync: 'デスクの保守メモと、端末の波の位置を見比べる。',
  puzzle_maintenance_lock: 'デスクの点検順と、部屋にある4つの銘板を調べる。',
  puzzle_log_pairing: '端末のLOGで、同じ波形を持つ通信を探す。',
  puzzle_signal_route: 'インターホンとSECURITYの配線図を見比べる。',
  puzzle_packet_repair: 'SIGNALに残った破損PACKETを調べる。',
  puzzle_temporal_anomaly: '復元した4文を、これまでの出来事と比べる。',
  puzzle_voiceprint_calibration: '職員カードと解析パネルの波形を見比べる。',
  puzzle_causal_script: '会話履歴を読み返し、送信する4文を並べる。',
  puzzle_transmission_window:
    '判明した時間差と回線を使い、送信予約を完成させる。',
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
  if (stage === 'puzzle_maintenance_lock') {
    if (hotspot === 'hotspot_door')
      return 'ドアの銘板には、ひし形の「◆」が刻まれている。';
    if (hotspot === 'hotspot_intercom')
      return '通話器の銘板には、丸い「○」が刻まれている。';
    if (hotspot === 'hotspot_breaker')
      return 'ECHO BUFFER回路の銘板には、三角の「△」が刻まれている。';
  }
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
