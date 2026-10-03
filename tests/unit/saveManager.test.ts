import { describe, expect, it } from 'vitest';

import {
  clearProgress,
  createPowerRestoredProgress,
  defaultSettings,
  loadProgress,
  loadSettings,
  SAVE_KEY,
  saveProgress,
  saveSettings,
  SETTINGS_KEY,
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
  it('round-trips a current seven-puzzle checkpoint as schema v4', () => {
    const storage = createStorage();
    saveProgress(
      createPowerRestoredProgress({
        checkpointId: 'checkpoint_puzzle_07',
        storyStage: 'puzzle_voiceprint_calibration',
        inventory: ['item_screwdriver', 'item_staff_card', 'item_floor_map'],
        completedPuzzleIds: [
          'puzzle_power_route',
          'puzzle_carrier_sync',
          'puzzle_maintenance_lock',
          'puzzle_signal_investigation',
          'puzzle_packet_repair',
        ],
        activeElapsedMs: 456_789,
        reservePower: true,
      }),
      storage,
    );
    expect(loadProgress(storage)).toMatchObject({
      status: 'valid',
      data: {
        schemaVersion: 4,
        contentVersion: '0.3.0',
        progress: {
          checkpointId: 'checkpoint_puzzle_07',
          storyStage: 'puzzle_voiceprint_calibration',
          activeElapsedMs: 456_789,
        },
      },
    });
  });

  it('rejects old and corrupt saves without mutating them', () => {
    const storage = createStorage();
    const old = JSON.stringify({ schemaVersion: 2, contentVersion: '0.1.0' });
    storage.setItem(SAVE_KEY, old);
    expect(loadProgress(storage)).toEqual({ status: 'corrupt' });
    expect(storage.getItem(SAVE_KEY)).toBe(old);
    storage.setItem(SAVE_KEY, '{bad json');
    expect(loadProgress(storage)).toEqual({ status: 'corrupt' });
  });

  it('keeps settings when progress is cleared', () => {
    const storage = createStorage();
    const settings = {
      ...defaultSettings,
      soundEnabled: false,
      visualAssist: true,
      soundLevels: { ...defaultSettings.soundLevels, effects: 35 },
    };
    saveProgress(createPowerRestoredProgress(), storage);
    saveSettings(settings, storage);
    clearProgress(storage);
    expect(storage.getItem(SAVE_KEY)).toBeNull();
    expect(storage.getItem(SETTINGS_KEY)).not.toBeNull();
    expect(loadSettings(storage)).toEqual(settings);
  });

  it('falls back to safe settings when settings data is corrupt', () => {
    const storage = createStorage();
    storage.setItem(SETTINGS_KEY, '{bad json');
    expect(loadSettings(storage)).toEqual(defaultSettings);
  });

  it('ignores the removed voice level without resetting v4 settings or end-game progress', () => {
    const storage = createStorage();
    const prior = {
      ...defaultSettings,
      soundEnabled: false,
      soundLevels: { effects: 35, environment: 55, voice: 85 },
    };
    storage.setItem(SETTINGS_KEY, JSON.stringify(prior));
    expect(loadSettings(storage)).toMatchObject({
      soundEnabled: false,
      soundLevels: { effects: 35, environment: 55 },
    });
    expect(loadSettings(storage).soundLevels).not.toHaveProperty('voice');
    const progress = createPowerRestoredProgress({
      storyStage: 'completed',
      checkpointId: 'checkpoint_completed',
      endingLineIndex: 8,
    });
    saveProgress(progress, storage);
    const raw = storage.getItem(SAVE_KEY);
    expect(loadProgress(storage)).toMatchObject({
      status: 'valid',
      data: { progress },
    });
    expect(storage.getItem(SAVE_KEY)).toBe(raw);
  });
});
