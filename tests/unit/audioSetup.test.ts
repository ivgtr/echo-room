import { defaultSettings, SETTINGS_KEY } from '../../src/game/save/saveManager';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AUDIO_CHOICE_KEY,
  AUDIO_UNLOCK_TIMEOUT_MS,
  AudioUnlockRequest,
  hasAudioChoice,
  rememberAudioChoice,
} from '../../src/audio/audioSetup';

afterEach(() => vi.useRealTimers());

describe('audio choice persistence', () => {
  it('requires an explicit, recognized marker', () => {
    for (const value of [null, '', 'true', '0', 'invalid']) {
      expect(hasAudioChoice(() => ({ getItem: () => value }))).toBe(false);
    }
    expect(
      hasAudioChoice(() => ({
        getItem: (key) =>
          key === SETTINGS_KEY ? JSON.stringify(defaultSettings) : '1',
      })),
    ).toBe(true);
  });

  it('does not skip the choice when its saved settings are missing or corrupt', () => {
    for (const settings of [null, '{bad json', '{}']) {
      expect(
        hasAudioChoice(() => ({
          getItem: (key) => (key === SETTINGS_KEY ? settings : '1'),
        })),
      ).toBe(false);
    }
  });

  it('tolerates a denied storage getter or read', () => {
    expect(
      hasAudioChoice(() => {
        throw new Error('denied');
      }),
    ).toBe(false);
    expect(
      hasAudioChoice(() => ({
        getItem: () => {
          throw new Error('denied');
        },
      })),
    ).toBe(false);
  });

  it('stores only the choice marker, never a duplicate master preference', () => {
    const setItem = vi.fn();
    rememberAudioChoice({ setItem });
    expect(setItem).toHaveBeenCalledExactlyOnceWith(AUDIO_CHOICE_KEY, '1');
  });
});

describe('AudioUnlockRequest', () => {
  it('calls unlock synchronously, before losing the user gesture', async () => {
    const result = vi.fn();
    const unlock = vi.fn(async () => true);
    new AudioUnlockRequest().run(unlock, result);
    expect(unlock).toHaveBeenCalledOnce();
    await Promise.resolve();
    expect(result).toHaveBeenCalledExactlyOnceWith('ready');
  });

  it('treats a resolved but non-running context as blocked', async () => {
    const result = vi.fn();
    new AudioUnlockRequest().run(async () => false, result);
    await Promise.resolve();
    expect(result).toHaveBeenCalledExactlyOnceWith('blocked');
  });

  it('handles rejection and synchronous construction failures', async () => {
    const result = vi.fn();
    const request = new AudioUnlockRequest();
    request.run(() => Promise.reject(new Error('blocked')), result);
    await Promise.resolve();
    expect(result).toHaveBeenLastCalledWith('blocked');
    request.run(() => {
      throw new Error('unsupported');
    }, result);
    expect(result).toHaveBeenCalledTimes(2);
  });

  it('times out without allowing late success to re-enable audio', async () => {
    vi.useFakeTimers();
    const result = vi.fn();
    let resolve!: (ready: boolean) => void;
    new AudioUnlockRequest().run(
      () =>
        new Promise<boolean>((done) => {
          resolve = done;
        }),
      result,
    );
    vi.advanceTimersByTime(AUDIO_UNLOCK_TIMEOUT_MS);
    expect(result).toHaveBeenCalledExactlyOnceWith('timeout');
    resolve(true);
    await Promise.resolve();
    expect(result).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ignores a response after mute, closing, starting, or unmounting', async () => {
    vi.useFakeTimers();
    const request = new AudioUnlockRequest();
    const result = vi.fn();
    let resolve!: (ready: boolean) => void;
    request.run(
      () =>
        new Promise<boolean>((done) => {
          resolve = done;
        }),
      result,
    );
    request.cancel();
    resolve(true);
    await Promise.resolve();
    expect(result).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('a retry supersedes any previous request', async () => {
    const request = new AudioUnlockRequest();
    const result = vi.fn();
    let resolve!: (ready: boolean) => void;
    request.run(
      () =>
        new Promise<boolean>((done) => {
          resolve = done;
        }),
      result,
    );
    request.run(async () => false, result);
    resolve(true);
    await Promise.resolve();
    expect(result).toHaveBeenCalledExactlyOnceWith('blocked');
  });
});
