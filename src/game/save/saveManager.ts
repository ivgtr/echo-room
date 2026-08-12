import { z } from 'zod';

import { puzzleIds } from '../puzzles/storyPuzzles';

export const SAVE_KEY = 'echo-room:progress';
export const SETTINGS_KEY = 'echo-room:settings';
export const CONTENT_VERSION = '0.3.0';

const checkpointSchema = z.enum([
  'checkpoint_puzzle_01',
  'checkpoint_puzzle_02',
  'checkpoint_puzzle_03',
  'checkpoint_puzzle_04',
  'checkpoint_puzzle_05',
  'checkpoint_puzzle_06',
  'checkpoint_puzzle_07',
  'checkpoint_transmission_started',
  'checkpoint_completed',
]);

const storyStageSchema = z.enum([
  'puzzle_carrier_sync',
  'puzzle_maintenance_lock',
  'puzzle_signal_investigation',
  'puzzle_packet_repair',
  'puzzle_voiceprint_calibration',
  'puzzle_transmission_window',
  'transmission_ready',
  'ending_transmission',
  'ending_replay',
  'ending_door',
  'completed',
]);

const puzzleIdSchema = z.enum(puzzleIds);

const puzzleFailuresSchema = z.object(
  Object.fromEntries(
    puzzleIds.map((id) => [id, z.number().int().nonnegative()]),
  ) as Record<(typeof puzzleIds)[number], z.ZodNumber>,
);

const progressSchema = z.object({
  checkpointId: checkpointSchema,
  powerRestored: z.literal(true),
  locationId: z.enum([
    'location_north_wall',
    'location_east_wall',
    'location_south_wall',
    'location_west_wall',
  ]),
  storyStage: storyStageSchema,
  inventory: z
    .array(z.enum(['item_screwdriver', 'item_staff_card', 'item_floor_map']))
    .max(3),
  completedPuzzleIds: z.array(puzzleIdSchema).max(7),
  puzzleFailures: puzzleFailuresSchema,
  endingLineIndex: z.number().int().min(0).max(6),
  hintLevel: z.number().int().min(0).max(3),
  activeElapsedMs: z.number().nonnegative(),
  reservePower: z.boolean(),
});

const saveSchemaV4 = z.object({
  schemaVersion: z.literal(4),
  contentVersion: z.literal(CONTENT_VERSION),
  savedAt: z.string().datetime(),
  progress: progressSchema,
});

const soundLevelsSchema = z.object({
  effects: z.number().min(0).max(100),
  environment: z.number().min(0).max(100),
});

const settingsSchema = z.object({
  schemaVersion: z.literal(4),
  soundEnabled: z.boolean(),
  visualAssist: z.boolean(),
  motionReduced: z.boolean(),
  introSeen: z.boolean(),
  soundLevels: soundLevelsSchema,
  subtitleSettings: z.object({
    size: z.enum(['small', 'medium', 'large']),
    background: z.enum(['soft', 'solid']),
    speed: z.enum(['slow', 'normal', 'fast']),
  }),
});

export type CheckpointId = z.infer<typeof checkpointSchema>;
export type SavedProgress = z.infer<typeof progressSchema>;
export type SaveData = z.infer<typeof saveSchemaV4>;
export type SettingsData = z.infer<typeof settingsSchema>;
export type LoadResult =
  | { status: 'empty' }
  | { status: 'valid'; data: SaveData }
  | { status: 'corrupt' };

export const defaultSettings: SettingsData = {
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
};

const emptyFailures = () =>
  Object.fromEntries(
    puzzleIds.map((id) => [id, 0]),
  ) as SavedProgress['puzzleFailures'];

export const createPowerRestoredProgress = (
  overrides: Partial<SavedProgress> = {},
): SavedProgress =>
  progressSchema.parse({
    checkpointId: 'checkpoint_puzzle_01',
    powerRestored: true,
    locationId: 'location_east_wall',
    storyStage: 'puzzle_carrier_sync',
    inventory: [],
    completedPuzzleIds: ['puzzle_power_route'],
    puzzleFailures: emptyFailures(),
    endingLineIndex: 0,
    hintLevel: 0,
    activeElapsedMs: 0,
    reservePower: false,
    ...overrides,
  });

export const getCheckpointId = (
  storyStage: SavedProgress['storyStage'],
  completedPuzzleIds: SavedProgress['completedPuzzleIds'],
): CheckpointId => {
  if (storyStage === 'completed') return 'checkpoint_completed';
  if (storyStage.startsWith('ending_'))
    return 'checkpoint_transmission_started';
  const count = Math.max(1, Math.min(7, completedPuzzleIds.length));
  return `checkpoint_puzzle_${String(count).padStart(2, '0')}` as CheckpointId;
};

export const createSave = (progress: SavedProgress): SaveData =>
  saveSchemaV4.parse({
    schemaVersion: 4,
    contentVersion: CONTENT_VERSION,
    savedAt: new Date().toISOString(),
    progress,
  });

export const saveProgress = (
  progress: SavedProgress,
  storage: Storage = window.localStorage,
) => {
  storage.setItem(SAVE_KEY, JSON.stringify(createSave(progress)));
};

export const loadProgress = (
  storage: Storage = window.localStorage,
): LoadResult => {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return { status: 'empty' };
  try {
    const parsed: unknown = JSON.parse(raw);
    const current = saveSchemaV4.safeParse(parsed);
    return current.success
      ? { status: 'valid', data: current.data }
      : { status: 'corrupt' };
  } catch {
    return { status: 'corrupt' };
  }
};

export const clearProgress = (storage: Storage = window.localStorage) => {
  storage.removeItem(SAVE_KEY);
};

export const loadSettings = (
  storage: Storage = window.localStorage,
): SettingsData => {
  const raw = storage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;
  try {
    return settingsSchema.parse(JSON.parse(raw));
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = (
  settings: SettingsData,
  storage: Storage = window.localStorage,
) => {
  storage.setItem(SETTINGS_KEY, JSON.stringify(settingsSchema.parse(settings)));
};
