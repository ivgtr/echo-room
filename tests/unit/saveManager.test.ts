import { describe, expect, it } from 'vitest';

import {
  loadProgress,
  SAVE_KEY,
  saveProgress,
} from '../../src/game/save/saveManager';

const createStorage = (): Storage => {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
};

describe('saveManager', () => {
  it('round-trips the safe power checkpoint', () => {
    const storage = createStorage();
    saveProgress(storage, 456_789, true);
    expect(loadProgress(storage)).toMatchObject({
      status: 'valid',
      data: { progress: { activeElapsedMs: 456_789, reservePower: true } },
    });
  });

  it('migrates an older checkpoint to an unused emergency timer', () => {
    const storage = createStorage();
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        contentVersion: '0.1.0',
        savedAt: '2026-08-11T00:00:00.000Z',
        progress: {
          checkpointId: 'checkpoint_power_restored',
          powerRestored: true,
          locationId: 'location_east_wall',
        },
      }),
    );
    expect(loadProgress(storage)).toMatchObject({
      status: 'valid',
      data: { progress: { activeElapsedMs: 0, reservePower: false } },
    });
  });

  it('protects a corrupt save instead of throwing', () => {
    const storage = createStorage();
    storage.setItem(SAVE_KEY, '{bad json');
    expect(loadProgress(storage)).toEqual({ status: 'corrupt' });
    expect(storage.getItem(SAVE_KEY)).toBe('{bad json');
  });
});
