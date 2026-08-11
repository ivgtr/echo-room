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

export const selectSubtitle = (snapshot: GameSnapshot) => {
  if (!snapshot.matches('playing')) return null;
  if (snapshot.matches({ playing: 'powered' })) return 'よし。次は端末だ。';
  if (snapshot.context.selectedHotspotId === 'hotspot_door') {
    return '非常ロックが作動している。電源系統を確認する必要がある。';
  }
  if (snapshot.context.selectedHotspotId === 'hotspot_desk') {
    return 'EMERGENCY POWER TEST――起動順序：周波数の低い回路から接続すること。';
  }
  return '現在目的：電源を戻す。西壁のブレーカーパネルを調べよう。';
};
