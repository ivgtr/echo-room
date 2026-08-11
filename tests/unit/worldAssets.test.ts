import { describe, expect, it } from 'vitest';

import { locationIds } from '../../src/game/domain/ids';
import {
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

  it('keeps hotspot rectangles inside the logical canvas', () => {
    for (const locationId of locationIds) {
      const ids = new Set<string>();
      for (const hotspot of worldViewAssets[locationId].hotspots) {
        expect(ids.has(hotspot.id)).toBe(false);
        ids.add(hotspot.id);
        expect(hotspot.rect.x).toBeGreaterThanOrEqual(0);
        expect(hotspot.rect.y).toBeGreaterThanOrEqual(0);
        expect(hotspot.rect.x + hotspot.rect.width).toBeLessThanOrEqual(1920);
        expect(hotspot.rect.y + hotspot.rect.height).toBeLessThanOrEqual(1080);
      }
    }
  });

  it('matches the approved west-wall object order', () => {
    const west = worldViewAssets.location_west_wall.hotspots;
    expect(
      west.find((hotspot) => hotspot.id === 'hotspot_locker')?.rect.x,
    ).toBe(275);
    expect(
      west.find((hotspot) => hotspot.id === 'hotspot_breaker')?.rect.x,
    ).toBe(1270);
  });
});
