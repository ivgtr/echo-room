import { describe, expect, it } from 'vitest';

import { locationIds } from '../../src/game/domain/ids';
import {
  getHotspotBounds,
  getWorldImage,
  worldViewAssets,
} from '../../src/world/assets/worldAssets';

describe('world runtime assets', () => {
  it('maps every view to powered and emergency WebP assets', () => {
    for (const locationId of locationIds) {
      expect(getWorldImage(locationId, false)).toMatch(/emergency\.webp$/);
      expect(getWorldImage(locationId, true)).toMatch(/powered\.webp$/);
    }
  });

  it('keeps hotspot polygons inside the logical canvas', () => {
    for (const locationId of locationIds) {
      const ids = new Set<string>();
      for (const hotspot of worldViewAssets[locationId].hotspots) {
        expect(ids.has(hotspot.id)).toBe(false);
        ids.add(hotspot.id);
        expect(hotspot.polygon.length).toBeGreaterThanOrEqual(6);
        for (const [x, y] of hotspot.polygon) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(1920);
          expect(y).toBeLessThanOrEqual(1080);
        }
      }
    }
  });

  it('matches the approved west-wall object order', () => {
    const west = worldViewAssets.location_west_wall.hotspots;
    expect(
      getHotspotBounds(west.find((hotspot) => hotspot.id === 'hotspot_locker')!)
        .x,
    ).toBe(278);
    expect(
      getHotspotBounds(
        west.find((hotspot) => hotspot.id === 'hotspot_breaker')!,
      ).x,
    ).toBe(1264);
  });
});
