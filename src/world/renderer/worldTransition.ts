import type { LocationId } from '../../game/domain/ids';

const VIEW_ORDER: readonly LocationId[] = [
  'location_north_wall',
  'location_east_wall',
  'location_south_wall',
  'location_west_wall',
];

export type WorldTransition = {
  duration: number;
  offsetX: number;
  midpointDim: number;
};

export function getWorldTransition(
  from: LocationId,
  to: LocationId,
  powerChanged: boolean,
  reduceMotion: boolean,
): WorldTransition {
  if (reduceMotion) {
    return {
      duration: powerChanged ? 240 : 140,
      offsetX: 0,
      midpointDim: 0,
    };
  }

  if (powerChanged) {
    return { duration: 600, offsetX: 0, midpointDim: 0.1 };
  }

  const fromIndex = VIEW_ORDER.indexOf(from);
  const toIndex = VIEW_ORDER.indexOf(to);
  const clockwiseDistance = (toIndex - fromIndex + VIEW_ORDER.length) % 4;

  if (clockwiseDistance === 2) {
    return { duration: 300, offsetX: 0, midpointDim: 0.2 };
  }

  return {
    duration: 240,
    offsetX: clockwiseDistance === 1 ? 26 : -26,
    midpointDim: 0.14,
  };
}
