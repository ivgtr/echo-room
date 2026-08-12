import { describe, expect, it } from 'vitest';

import { getOppositeCornerPaths } from '../../src/ui/exploration/inspectionTraceGeometry';

describe('inspection trace', () => {
  it('splits a rectangle into simultaneous paths from top-left and bottom-right', () => {
    const paths = getOppositeCornerPaths([
      [0, 0],
      [100, 0],
      [100, 80],
      [0, 80],
    ]);

    expect(paths).toEqual([
      [
        [0, 0],
        [100, 0],
        [100, 80],
      ],
      [
        [100, 80],
        [0, 80],
        [0, 0],
      ],
    ]);
  });
});
