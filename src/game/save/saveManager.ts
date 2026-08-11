import { z } from 'zod';

export const SAVE_KEY = 'echo-room:progress';

const saveSchema = z.object({
  schemaVersion: z.literal(1),
  contentVersion: z.literal('0.1.0'),
  savedAt: z.string(),
  progress: z.object({
    checkpointId: z.literal('checkpoint_power_restored'),
    powerRestored: z.literal(true),
    locationId: z.literal('location_east_wall'),
    activeElapsedMs: z.number().nonnegative().default(0),
    reservePower: z.boolean().default(false),
  }),
});

export type SaveData = z.infer<typeof saveSchema>;
export type LoadResult =
  | { status: 'empty' }
  | { status: 'valid'; data: SaveData }
  | { status: 'corrupt' };

export const createPowerRestoredSave = (
  activeElapsedMs = 0,
  reservePower = false,
): SaveData => ({
  schemaVersion: 1,
  contentVersion: '0.1.0',
  savedAt: new Date().toISOString(),
  progress: {
    checkpointId: 'checkpoint_power_restored',
    powerRestored: true,
    locationId: 'location_east_wall',
    activeElapsedMs,
    reservePower,
  },
});

export const saveProgress = (
  storage: Storage = window.localStorage,
  activeElapsedMs = 0,
  reservePower = false,
) => {
  storage.setItem(
    SAVE_KEY,
    JSON.stringify(createPowerRestoredSave(activeElapsedMs, reservePower)),
  );
};

export const loadProgress = (
  storage: Storage = window.localStorage,
): LoadResult => {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return { status: 'empty' };
  try {
    return { status: 'valid', data: saveSchema.parse(JSON.parse(raw)) };
  } catch {
    return { status: 'corrupt' };
  }
};
