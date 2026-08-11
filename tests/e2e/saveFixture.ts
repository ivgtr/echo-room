import type {
  SavedProgress,
  SettingsData,
} from '../../src/game/save/saveManager';

type ProgressOverrides = Partial<SavedProgress>;

export function createProgressSave(overrides: ProgressOverrides = {}) {
  return {
    schemaVersion: 2 as const,
    contentVersion: '0.1.0' as const,
    savedAt: '2026-08-11T00:00:00.000Z',
    progress: {
      checkpointId: 'checkpoint_power_restored' as const,
      powerRestored: true as const,
      locationId: 'location_east_wall' as const,
      storyStage: 'inspect_logs' as const,
      inventory: [] as (
        'item_screwdriver' | 'item_staff_card' | 'item_floor_map'
      )[],
      inspectedMaps: [] as ('inventory' | 'security')[],
      heardPackets: [] as (
        | 'audio_packet_01'
        | 'audio_packet_02'
        | 'audio_packet_03'
        | 'audio_packet_04'
      )[],
      finalOrderReady: false,
      endingLineIndex: 0,
      hintLevel: 0,
      breakerFailures: 0,
      lockerFailures: 0,
      activeElapsedMs: 0,
      reservePower: false,
      ...overrides,
    },
  };
}

export const installProgressSave = (
  save: ReturnType<typeof createProgressSave>,
) => {
  if (localStorage.getItem('echo-room:progress')) return;
  localStorage.setItem('echo-room:progress', JSON.stringify(save));
};

export function createSettingsSave(
  overrides: Partial<SettingsData> = {},
): SettingsData {
  return {
    schemaVersion: 4,
    soundEnabled: true,
    visualAssist: false,
    motionReduced: false,
    introSeen: false,
    soundLevels: { effects: 100, environment: 70 },
    subtitleSettings: {
      size: 'medium',
      background: 'soft',
      speed: 'normal',
    },
    ...overrides,
  };
}

export const installSettingsSave = (settings: SettingsData) => {
  if (localStorage.getItem('echo-room:settings')) return;
  localStorage.setItem('echo-room:settings', JSON.stringify(settings));
};
