import { describe, expect, it, vi } from 'vitest';

import { SoundManager, type SoundState } from '../../src/audio/soundManager';
import { voiceAssets, voiceCues } from '../../src/audio/voiceManifest';
import {
  endingEntries,
  introEntries,
} from '../../src/ui/narrative/narrativeArchive';

const param = () => ({
  value: 1,
  cancelScheduledValues() {},
  setTargetAtTime() {},
  linearRampToValueAtTime() {},
  setValueAtTime() {},
  exponentialRampToValueAtTime() {},
});

class FakeNode {
  gain = param();
  frequency = param();
  Q = param();
  buffer: AudioBuffer | null = null;
  onended: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  connect(node: FakeNode) {
    return node;
  }
  disconnect() {}
}

const activeState: SoundState = {
  active: true,
  enabled: true,
  effectsVolume: 35,
  voiceVolume: 85,
  environmentVolume: 55,
  powered: false,
  powerPhase: 'normal',
};

const createManager = (
  fetchAudio: typeof fetch = vi.fn(
    async () => new Response(new ArrayBuffer(4)),
  ),
) => {
  const context = {
    currentTime: 10,
    sampleRate: 24000,
    state: 'suspended' as AudioContextState,
    destination: new FakeNode(),
    createGain: () => new FakeNode(),
    createBiquadFilter: () => new FakeNode(),
    createWaveShaper: () => new FakeNode(),
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    createBufferSource: vi.fn(() => new FakeNode()),
    createOscillator: vi.fn(() => new FakeNode()),
    decodeAudioData: vi.fn(async () => ({ duration: 2 }) as AudioBuffer),
    async resume() {
      this.state = 'running';
    },
    async close() {
      this.state = 'closed';
    },
  };
  return {
    context,
    manager: new SoundManager(
      () => context as unknown as AudioContext,
      fetchAudio,
    ),
  };
};

const expectPlaying = (manager: SoundManager) =>
  vi.waitFor(() => expect(manager.getVoicePlayback().status).toBe('playing'));

describe('SoundManager', () => {
  it('starts ambience only after unlock and stops it when sound is disabled', async () => {
    const { context, manager } = createManager();
    manager.sync(activeState);
    expect(context.createOscillator).not.toHaveBeenCalled();
    expect(await manager.unlock()).toBe(true);
    const ambience = context.createOscillator.mock.results.map(
      ({ value }) => value,
    );
    expect(ambience.length).toBeGreaterThan(0);
    for (const source of ambience) expect(source.start).toHaveBeenCalled();
    manager.sync({ ...activeState, enabled: false });
    for (const source of ambience) expect(source.stop).toHaveBeenCalled();
    manager.dispose();
  });

  it('uses one opening/final take and limits voiced lines to the three intended roles', async () => {
    expect(voiceCues).toEqual({
      intro_02: { asset: 'first_contact', treatment: 'radio' },
      identity_answer: { asset: 'identity', treatment: 'radio', reveal: true },
      ending_first_contact: { asset: 'first_contact', treatment: 'near' },
    });
    expect(
      endingEntries.find(({ id }) => id === 'ending_first_contact')?.text,
    ).toBe(introEntries[1].text);
    const fetchAudio = vi.fn(async () => new Response(new ArrayBuffer(4)));
    const { manager, context } = createManager(fetchAudio);
    manager.sync(activeState);
    await manager.unlock();
    manager.playVoice('intro_02');
    await expectPlaying(manager);
    const opening = context.createBufferSource.mock.results[0]!.value;
    manager.playVoice('ending_first_contact');
    await expectPlaying(manager);
    const final = context.createBufferSource.mock.results.at(-1)!.value;
    expect(opening.stop).toHaveBeenCalled();
    expect(final.buffer).toBe(opening.buffer);
    expect(fetchAudio).toHaveBeenCalledExactlyOnceWith(
      voiceAssets.first_contact,
      expect.any(Object),
    );
    final.onended?.();
    expect(manager.getVoicePlayback().status).toBe('idle');
    manager.dispose();
  });

  it('ignores a late decoded clip after its scene has been cancelled', async () => {
    let resolveDecode!: (buffer: AudioBuffer) => void;
    const { manager, context } = createManager();
    context.decodeAudioData.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDecode = resolve;
        }),
    );
    manager.sync(activeState);
    await manager.unlock();
    const cancel = manager.playVoice('identity_answer');
    await vi.waitFor(() =>
      expect(context.decodeAudioData).toHaveBeenCalledOnce(),
    );
    cancel();
    resolveDecode({ duration: 2 } as AudioBuffer);
    await Promise.resolve();
    expect(context.createBufferSource).not.toHaveBeenCalled();
    expect(manager.getVoicePlayback().status).toBe('idle');
    manager.dispose();
  });

  it('stops scene audio on pause, permits explicit archive playback, and respects mute', async () => {
    const { manager, context } = createManager();
    manager.sync(activeState);
    await manager.unlock();
    manager.playVoice('identity_answer');
    await expectPlaying(manager);
    const sceneSources = context.createBufferSource.mock.results.map(
      ({ value }) => value,
    );
    manager.sync({ ...activeState, paused: true });
    expect(manager.getVoicePlayback().status).toBe('idle');
    for (const source of sceneSources) expect(source.stop).toHaveBeenCalled();
    manager.playVoice('identity_answer', 'archive');
    await expectPlaying(manager);
    manager.sync({ ...activeState, enabled: false });
    manager.playVoice('identity_answer', 'archive');
    expect(manager.getVoicePlayback().status).toBe('idle');
    for (const { value } of context.createBufferSource.mock.results)
      expect(value.stop).toHaveBeenCalled();
    manager.dispose();
  });

  it('leaves unvoiced text silent and allows retry after an unavailable clip', async () => {
    const fetchAudio = vi.fn(async () => new Response('', { status: 404 }));
    const { manager } = createManager(fetchAudio);
    manager.sync(activeState);
    await manager.unlock();
    manager.playVoice('intro_01');
    manager.playVoice('packet_04');
    expect(fetchAudio).not.toHaveBeenCalled();
    manager.playVoice('intro_02');
    await vi.waitFor(() =>
      expect(manager.getVoicePlayback().status).toBe('unavailable'),
    );
    fetchAudio.mockImplementation(async () => new Response(new ArrayBuffer(4)));
    manager.playVoice('intro_02');
    await expectPlaying(manager);
    manager.dispose();
  });
});
