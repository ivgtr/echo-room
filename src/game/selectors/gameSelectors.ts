import type { SnapshotFrom } from 'xstate';

import type { gameMachine } from '../machine/gameMachine';

export type GameSnapshot = SnapshotFrom<typeof gameMachine>;

export const selectIsPlaying = (snapshot: GameSnapshot) =>
  snapshot.matches('playing');
export const selectIsIntro = (snapshot: GameSnapshot) =>
  snapshot.matches({ playing: 'intro' });
export const selectIsBreakerPuzzle = (snapshot: GameSnapshot) =>
  snapshot.matches({ playing: 'breakerPuzzle' });
export const selectLocation = (snapshot: GameSnapshot) =>
  snapshot.context.locationId;
export const selectSelectedHotspot = (snapshot: GameSnapshot) =>
  snapshot.context.selectedHotspotId;
export const selectPowerRestored = (snapshot: GameSnapshot) =>
  snapshot.context.powerRestored;
export const selectBreakerSequence = (snapshot: GameSnapshot) =>
  snapshot.context.breakerSequence;
export const selectBreakerFailures = (snapshot: GameSnapshot) =>
  snapshot.context.breakerFailures;
export const selectIntroLineIndex = (snapshot: GameSnapshot) =>
  snapshot.context.introLineIndex;
export const selectTerminalMenu = (snapshot: GameSnapshot) =>
  snapshot.context.terminalMenuId;
export const selectStoryStage = (snapshot: GameSnapshot) =>
  snapshot.context.storyStage;
export const selectInventory = (snapshot: GameSnapshot) =>
  snapshot.context.inventory;
export const selectLockerFailures = (snapshot: GameSnapshot) =>
  snapshot.context.lockerFailures;
export const selectInspectedMaps = (snapshot: GameSnapshot) =>
  snapshot.context.inspectedMaps;
export const selectHeardPackets = (snapshot: GameSnapshot) =>
  snapshot.context.heardPackets;
export const selectFinalOrderReady = (snapshot: GameSnapshot) =>
  snapshot.context.finalOrderReady;
export const selectEndingLineIndex = (snapshot: GameSnapshot) =>
  snapshot.context.endingLineIndex;
export const selectHintLevel = (snapshot: GameSnapshot) =>
  snapshot.context.hintLevel;
export const selectActiveElapsedMs = (snapshot: GameSnapshot) =>
  snapshot.context.activeElapsedMs;
export const selectReservePower = (snapshot: GameSnapshot) =>
  snapshot.context.reservePower;

export const selectObjective = (snapshot: GameSnapshot) => {
  if (!snapshot.matches('playing')) return null;
  if (snapshot.matches({ playing: 'powered' })) {
    const objectives: Record<string, string> = {
      inspect_logs: '端末のLOGで受信時刻と送信元時刻を確認しよう。',
      unlock_locker: '送信側の時刻を使って西壁のロッカーを開けよう。',
      reveal_no_adjacent_room: '所持品とSECURITY、2つのフロア図を確認しよう。',
      inspect_audio: '端末のAUDIOでPACKET 01〜04を確認しよう。',
      analyze_voice: '端末横の解析パネルをドライバーで開けよう。',
      transmit_packets: '冒頭で聞いた4つの音声を正しい順に並べよう。',
    };
    return objectives[snapshot.context.storyStage] ?? 'よし。次は端末だ。';
  }
  return '非常電源を復旧する。室内を観察し、電源設備を探す。';
};

export const selectSubtitle = (snapshot: GameSnapshot) => {
  if (!snapshot.matches('playing')) return null;
  if (snapshot.context.selectedHotspotId === 'hotspot_door') {
    return '非常ロックが作動している。電源系統を確認する必要がある。';
  }
  if (snapshot.context.selectedHotspotId === 'hotspot_intercom') {
    return '通信回線は生きている。受信を待つしかなさそうだ。';
  }
  if (
    snapshot.context.selectedHotspotId === 'hotspot_terminal' &&
    !snapshot.context.powerRestored
  ) {
    return '端末には電源が来ていない。';
  }
  if (
    snapshot.context.selectedHotspotId === 'hotspot_analysis_panel' &&
    snapshot.context.storyStage !== 'analyze_voice'
  ) {
    return '固定パネルだ。今は開ける理由がない。';
  }
  if (
    snapshot.context.selectedHotspotId === 'hotspot_locker' &&
    snapshot.context.storyStage !== 'unlock_locker'
  ) {
    return '電子錠が掛かっている。今は使うべき時刻が分からない。';
  }
  return null;
};
