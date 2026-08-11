import { describe, expect, it } from 'vitest';

import { getWorldTransition } from '../../src/world/renderer/worldTransition';

describe('world view transitions', () => {
  it('uses directional movement for adjacent turns', () => {
    expect(
      getWorldTransition(
        'location_north_wall',
        'location_east_wall',
        false,
        false,
      ),
    ).toEqual({ duration: 240, offsetX: 26, midpointDim: 0.14 });
    expect(
      getWorldTransition(
        'location_north_wall',
        'location_west_wall',
        false,
        false,
      ).offsetX,
    ).toBe(-26);
  });

  it('uses a longer stationary transition for power restoration', () => {
    expect(
      getWorldTransition(
        'location_west_wall',
        'location_west_wall',
        true,
        false,
      ),
    ).toEqual({ duration: 600, offsetX: 0, midpointDim: 0.1 });
  });

  it('removes movement when reduced motion is requested', () => {
    expect(
      getWorldTransition(
        'location_north_wall',
        'location_east_wall',
        false,
        true,
      ),
    ).toEqual({ duration: 140, offsetX: 0, midpointDim: 0 });
  });
});
