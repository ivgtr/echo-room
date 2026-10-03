import { describe, expect, it, vi } from 'vitest';

import { SoundManager, type SoundState } from '../../src/audio/soundManager';
import { voiceAssets, voiceCues } from '../../src/audio/voiceManifest';
import {
  endingEntries,
  getPuzzleCompletionEntries,
  introEntries,
  packetEntries,
} from '../../src/ui/narrative/narrativeArchive';
import { puzzleIds } from '../../src/game/puzzles/storyPuzzles';

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
  disconnect = vi.fn();
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
    onstatechange: null as (() => void) | null,
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

  it('voices every future line over radio and reuses the opening take for the sole current-side voice', async () => {
    const storyEntries = [
      ...introEntries,
      ...puzzleIds.flatMap(getPuzzleCompletionEntries),
      ...packetEntries,
    ];
    const futureEntries = storyEntries.filter(
      ({ kind }) => kind === 'communication',
    );
    expect(Object.keys(voiceCues).sort()).toEqual(
      [...futureEntries.map(({ id }) => id), 'ending_first_contact'].sort(),
    );
    for (const entry of futureEntries)
      expect(voiceCues[entry.id]?.treatment).toBe('radio');
    expect(voiceCues.identity_answer?.reveal).toBe(true);
    expect(voiceCues.ending_first_contact).toEqual({
      asset: 'first_contact',
      treatment: 'near',
    });
    expect(voiceCues.packet_01?.asset).toBe(voiceCues.intro_02?.asset);
    expect(voiceCues.packet_03?.asset).toBe(voiceCues.offset_warning?.asset);
    for (const entry of endingEntries.filter(
      ({ id }) => id !== 'ending_first_contact',
    ))
      expect(voiceCues[entry.id]).toBeUndefined();
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

  it('cuts dialogue tails at voice onset while retaining device feedback and releasing nodes', async () => {
    let resolveFetch!: (response: Response) => void;
    const { manager, context } = createManager(
      () => new Promise((resolve) => (resolveFetch = resolve)),
    );
    manager.sync({ ...activeState, environmentVolume: 0 });
    await manager.unlock();
    manager.playEffect('ui_click', 'dialogue');
    const click = context.createOscillator.mock.results.at(-1)!.value;
    manager.playVoice('intro_02');
    manager.playEffect('ui_click', 'dialogue');
    expect(context.createOscillator).toHaveBeenCalledTimes(1);
    manager.playEffect('text_blip');
    const blip = context.createOscillator.mock.results.at(-1)!.value;
    manager.playEffect('packet_snap');
    const device = context.createOscillator.mock.results.slice(-2);
    context.currentTime += 0.01;
    resolveFetch(new Response(new ArrayBuffer(4)));
    await expectPlaying(manager);
    const voice = context.createBufferSource.mock.results[0]!.value;
    expect(voice.start).toHaveBeenCalledWith(10.01);
    for (const source of [click, blip]) {
      expect(source.stop).toHaveBeenLastCalledWith();
      expect(source.disconnect).toHaveBeenCalledOnce();
      expect(source.disconnect.mock.invocationCallOrder[0]).toBeLessThan(
        voice.start.mock.invocationCallOrder[0]!,
      );
      expect(source.onended).toBeNull();
    }
    for (const { value } of device) {
      expect(value.stop).toHaveBeenCalledOnce(); // Scheduled finish only.
      expect(value.disconnect).not.toHaveBeenCalled();
    }
    const count = context.createOscillator.mock.calls.length;
    manager.playEffect('text_blip');
    manager.playEffect('ui_click', 'dialogue');
    expect(context.createOscillator).toHaveBeenCalledTimes(count);
    manager.playEffect('ui_click');
    expect(context.createOscillator).toHaveBeenCalledTimes(count + 1);
    context.state = 'suspended';
    context.onstatechange?.();
    expect(manager.getVoicePlayback().status).toBe('idle');
    for (const { value } of device)
      expect(value.disconnect).toHaveBeenCalledOnce();
    expect(voice.stop).toHaveBeenCalled();
    await manager.unlock();
    manager.playEffect('text_blip');
    expect(context.createOscillator).toHaveBeenCalledTimes(count + 2);
    manager.dispose();
    expect(context.onstatechange).toBeNull();
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
    const { manager, context } = createManager(fetchAudio);
    manager.sync({ ...activeState, environmentVolume: 0 });
    await manager.unlock();
    manager.playVoice('intro_01');
    manager.playVoice('ending_power');
    expect(fetchAudio).not.toHaveBeenCalled();
    manager.playEffect('text_blip');
    manager.playEffect('ui_click', 'dialogue');
    expect(context.createOscillator).toHaveBeenCalledTimes(2);
    manager.playVoice('intro_02');
    await vi.waitFor(() =>
      expect(manager.getVoicePlayback().status).toBe('unavailable'),
    );
    manager.playEffect('text_blip');
    manager.playEffect('ui_click', 'dialogue');
    expect(context.createOscillator).toHaveBeenCalledTimes(4);
    fetchAudio.mockImplementation(async () => new Response(new ArrayBuffer(4)));
    manager.playVoice('intro_02');
    await expectPlaying(manager);
    manager.sync({ ...activeState, environmentVolume: 0, voiceVolume: 0 });
    manager.playEffect('text_blip');
    manager.playEffect('ui_click', 'dialogue');
    expect(context.createOscillator).toHaveBeenCalledTimes(6);
    manager.dispose();
  });
});
