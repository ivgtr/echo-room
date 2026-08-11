import type {
  SavedProgress,
  SettingsData,
} from '../../src/game/save/saveManager';
import { puzzleIds } from '../../src/game/puzzles/storyPuzzles';

type ProgressOverrides = Partial<SavedProgress>;

export function createProgressSave(overrides: ProgressOverrides = {}) {
  return {
    schemaVersion: 4 as const,
    contentVersion: '0.3.0' as const,
    savedAt: '2026-08-12T00:00:00.000Z',
    progress: {
      checkpointId: 'checkpoint_puzzle_01' as const,
      powerRestored: true as const,
      locationId: 'location_east_wall' as const,
      storyStage: 'puzzle_carrier_sync' as const,
      inventory: [] as SavedProgress['inventory'],
      completedPuzzleIds: [
        'puzzle_power_route',
      ] as SavedProgress['completedPuzzleIds'],
      puzzleFailures: Object.fromEntries(
        puzzleIds.map((id) => [id, 0]),
      ) as SavedProgress['puzzleFailures'],
      endingLineIndex: 0,
      hintLevel: 0,
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
