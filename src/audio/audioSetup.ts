import { SETTINGS_KEY, settingsSchema } from '../game/save/saveManager';

/** This records a choice, not browser permission. The actual volume lives in settings. */
export const AUDIO_CHOICE_KEY = 'echo-room:audio-choice:v1';
export const AUDIO_UNLOCK_TIMEOUT_MS = 3000;

export function hasAudioChoice(
  getStorage: () => Pick<Storage, 'getItem'> = () => window.localStorage,
): boolean {
  try {
    const storage = getStorage();
    return (
      storage.getItem(AUDIO_CHOICE_KEY) === '1' &&
      settingsSchema.safeParse(
        JSON.parse(storage.getItem(SETTINGS_KEY) ?? 'null'),
      ).success
    );
  } catch {
    return false;
  }
}

/** Call only after the matching settings have been saved successfully. */
export function rememberAudioChoice(storage: Pick<Storage, 'setItem'>): void {
  storage.setItem(AUDIO_CHOICE_KEY, '1');
}

export type AudioUnlockResult = 'ready' | 'blocked' | 'timeout';

/** A late resume must never undo a newer mute choice or revive an unmounted UI. */
export class AudioUnlockRequest {
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  cancel(): void {
    this.generation += 1;
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }

  run(
    unlock: () => Promise<boolean>,
    onResult: (result: AudioUnlockResult) => void,
  ): void {
    this.cancel();
    const generation = this.generation;
    const finish = (result: AudioUnlockResult) => {
      if (generation !== this.generation) return;
      this.cancel();
      onResult(result);
    };
    this.timer = setTimeout(() => finish('timeout'), AUDIO_UNLOCK_TIMEOUT_MS);

    // Invoke synchronously in the click handler, not in an effect or a timer.
    try {
      void unlock().then(
        (ready) => finish(ready ? 'ready' : 'blocked'),
        () => finish('blocked'),
      );
    } catch {
      finish('blocked');
    }
  }
}
