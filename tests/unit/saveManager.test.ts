import { describe, expect, it } from 'vitest';

import {
  clearProgress,
  createPowerRestoredProgress,
  defaultSettings,
  getCheckpointId,
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
  it('round-trips a safe late-game checkpoint as schema v2', () => {
    const storage = createStorage();
    saveProgress(
      createPowerRestoredProgress({
        checkpointId: 'checkpoint_voice_identity',
        locationId: 'location_east_wall',
        storyStage: 'transmit_packets',
        inventory: ['item_screwdriver', 'item_staff_card', 'item_floor_map'],
        inspectedMaps: ['inventory', 'security'],
        heardPackets: [
          'audio_packet_01',
          'audio_packet_02',
          'audio_packet_03',
          'audio_packet_04',
        ],
        activeElapsedMs: 456_789,
        reservePower: true,
      }),
      storage,
    );
    expect(loadProgress(storage)).toMatchObject({
      status: 'valid',
      data: {
        schemaVersion: 2,
        progress: {
          checkpointId: 'checkpoint_voice_identity',
          storyStage: 'transmit_packets',
          activeElapsedMs: 456_789,
          reservePower: true,
        },
      },
    });
  });

  it('rejects an unsupported schema without mutating the stored source', () => {
    const storage = createStorage();
    const legacyRaw = JSON.stringify({
      schemaVersion: 1,
      contentVersion: '0.1.0',
      savedAt: '2026-08-11T00:00:00.000Z',
      progress: {
        checkpointId: 'checkpoint_power_restored',
        powerRestored: true,
        locationId: 'location_east_wall',
        activeElapsedMs: 1234,
        reservePower: false,
      },
    });
    storage.setItem(SAVE_KEY, legacyRaw);
    expect(loadProgress(storage)).toEqual({ status: 'corrupt' });
    expect(storage.getItem(SAVE_KEY)).toBe(legacyRaw);
  });

  it('protects corrupt and unsupported saves instead of overwriting them', () => {
    const storage = createStorage();
    storage.setItem(SAVE_KEY, '{bad json');
    expect(loadProgress(storage)).toEqual({ status: 'corrupt' });
    expect(storage.getItem(SAVE_KEY)).toBe('{bad json');

    storage.setItem(SAVE_KEY, JSON.stringify({ schemaVersion: 99 }));
    expect(loadProgress(storage)).toEqual({ status: 'corrupt' });
    expect(storage.getItem(SAVE_KEY)).toBe('{"schemaVersion":99}');
  });

  it('keeps settings when progress is cleared', () => {
    const storage = createStorage();
    const settings = {
      ...defaultSettings,
      soundEnabled: false,
      visualAssist: true,
      soundLevels: { ...defaultSettings.soundLevels, effects: 35 },
      subtitleSettings: {
        size: 'large' as const,
        background: 'solid' as const,
        speed: 'fast' as const,
      },
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

  it('maps every story stage to a safe checkpoint', () => {
    expect(getCheckpointId('inspect_logs', false)).toBe(
      'checkpoint_power_restored',
    );
    expect(getCheckpointId('unlock_locker', false)).toBe(
      'checkpoint_time_offset_confirmed',
    );
    expect(getCheckpointId('reveal_no_adjacent_room', false)).toBe(
      'checkpoint_locker_opened',
    );
    expect(getCheckpointId('inspect_audio', false)).toBe(
      'checkpoint_no_adjacent_room',
    );
    expect(getCheckpointId('analyze_voice', false)).toBe(
      'checkpoint_audio_packets',
    );
    expect(getCheckpointId('transmit_packets', false)).toBe(
      'checkpoint_voice_identity',
    );
    expect(getCheckpointId('transmit_packets', true)).toBe(
      'checkpoint_final_order_ready',
    );
    expect(getCheckpointId('ending', true)).toBe(
      'checkpoint_transmission_started',
    );
    expect(getCheckpointId('completed', true)).toBe('checkpoint_completed');
  });
});
