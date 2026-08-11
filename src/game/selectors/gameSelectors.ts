import type { SnapshotFrom } from 'xstate';

import type { gameMachine } from '../machine/gameMachine';

export type GameSnapshot = SnapshotFrom<typeof gameMachine>;

export const selectIsPlaying = (snapshot: GameSnapshot) =>
  snapshot.matches('playing');

export const selectSelectedHotspot = (snapshot: GameSnapshot) =>
  snapshot.context.selectedHotspotId;

export const selectSubtitle = (snapshot: GameSnapshot) => {
  if (!snapshot.matches('playing')) return null;
  if (snapshot.context.selectedHotspotId === 'hotspot_door') {
    return '非常ロックが作動している。電源系統を確認する必要がある。';
  }
  return '室内は非常灯の赤い光に沈んでいる。';
};
