import { z } from 'zod';

export const SAVE_KEY = 'echo-room:progress';
export const SETTINGS_KEY = 'echo-room:settings';
export const CONTENT_VERSION = '0.1.0';

const checkpointSchema = z.enum([
  'checkpoint_power_restored',
  'checkpoint_time_offset_confirmed',
  'checkpoint_locker_opened',
  'checkpoint_no_adjacent_room',
  'checkpoint_audio_packets',
  'checkpoint_voice_identity',
  'checkpoint_final_order_ready',
  'checkpoint_transmission_started',
  'checkpoint_completed',
]);

const storyStageSchema = z.enum([
  'inspect_logs',
  'unlock_locker',
  'reveal_no_adjacent_room',
  'inspect_audio',
  'analyze_voice',
  'transmit_packets',
  'ending',
  'completed',
]);

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
  inspectedMaps: z.array(z.enum(['inventory', 'security'])).max(2),
  heardPackets: z
    .array(
      z.enum([
        'audio_packet_01',
        'audio_packet_02',
        'audio_packet_03',
        'audio_packet_04',
      ]),
    )
    .max(4),
  finalOrderReady: z.boolean(),
  endingLineIndex: z.number().int().min(0).max(6),
  hintLevel: z.number().int().min(0).max(3),
  breakerFailures: z.number().int().nonnegative(),
  lockerFailures: z.number().int().nonnegative(),
  activeElapsedMs: z.number().nonnegative(),
  reservePower: z.boolean(),
});

const saveSchemaV2 = z.object({
  schemaVersion: z.literal(2),
  contentVersion: z.literal(CONTENT_VERSION),
  savedAt: z.string().datetime(),
  progress: progressSchema,
});

const audioLevelsSchema = z.object({
  voice: z.number().min(0).max(100),
  effects: z.number().min(0).max(100),
  environment: z.number().min(0).max(100),
});

const settingsSchema = z.object({
  schemaVersion: z.literal(2),
  audioEnabled: z.boolean(),
  visualAssist: z.boolean(),
  motionReduced: z.boolean(),
  audioLevels: audioLevelsSchema,
  subtitleSettings: z.object({
    size: z.enum(['small', 'medium', 'large']),
    background: z.enum(['soft', 'solid']),
    speed: z.enum(['slow', 'normal', 'fast']),
  }),
});

export type CheckpointId = z.infer<typeof checkpointSchema>;
export type SavedProgress = z.infer<typeof progressSchema>;
export type SaveData = z.infer<typeof saveSchemaV2>;
export type SettingsData = z.infer<typeof settingsSchema>;
export type LoadResult =
  | { status: 'empty' }
  | { status: 'valid'; data: SaveData }
  | { status: 'corrupt' };

export const defaultSettings: SettingsData = {
  schemaVersion: 2,
  audioEnabled: true,
  visualAssist: false,
  motionReduced: false,
  audioLevels: { voice: 100, effects: 100, environment: 70 },
  subtitleSettings: {
    size: 'medium',
    background: 'soft',
    speed: 'normal',
  },
};

export const createPowerRestoredProgress = (
  overrides: Partial<SavedProgress> = {},
): SavedProgress =>
  progressSchema.parse({
    checkpointId: 'checkpoint_power_restored',
    powerRestored: true,
    locationId: 'location_east_wall',
    storyStage: 'inspect_logs',
    inventory: [],
    inspectedMaps: [],
    heardPackets: [],
    finalOrderReady: false,
    endingLineIndex: 0,
    hintLevel: 0,
    breakerFailures: 0,
    lockerFailures: 0,
    activeElapsedMs: 0,
    reservePower: false,
    ...overrides,
  });

export const getCheckpointId = (
  storyStage: SavedProgress['storyStage'],
  finalOrderReady: boolean,
): CheckpointId => {
  if (storyStage === 'completed') return 'checkpoint_completed';
  if (storyStage === 'ending') return 'checkpoint_transmission_started';
  if (storyStage === 'transmit_packets')
    return finalOrderReady
      ? 'checkpoint_final_order_ready'
      : 'checkpoint_voice_identity';
  if (storyStage === 'analyze_voice') return 'checkpoint_audio_packets';
  if (storyStage === 'inspect_audio') return 'checkpoint_no_adjacent_room';
  if (storyStage === 'reveal_no_adjacent_room')
    return 'checkpoint_locker_opened';
  if (storyStage === 'unlock_locker') return 'checkpoint_time_offset_confirmed';
  return 'checkpoint_power_restored';
};

export const createSave = (progress: SavedProgress): SaveData =>
  saveSchemaV2.parse({
    schemaVersion: 2,
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
    const current = saveSchemaV2.safeParse(parsed);
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
