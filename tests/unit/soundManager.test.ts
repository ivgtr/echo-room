import { describe, expect, it, vi } from 'vitest';
import { voiceAssets, voiceCues } from '../../src/audio/voiceManifest';
import {
  endingEntries,
  introEntries,
} from '../../src/ui/narrative/narrativeArchive';

import {
  SOUND_CUES,
  SoundManager,
  type SoundState,
} from '../../src/audio/soundManager';

class FakeAudioParam {
  value = 1;

  cancelScheduledValues() {}

  setTargetAtTime(value: number) {
    this.value = value;
  }

  linearRampToValueAtTime(value: number) {
    this.value = value;
  }

  setValueAtTime(value: number) {
    this.value = value;
  }

  exponentialRampToValueAtTime(value: number) {
    this.value = value;
  }
}

class FakeNode {
  connect() {
    return this;
  }

  disconnect() {}
}

class FakeGain extends FakeNode {
  gain = new FakeAudioParam();
}

class FakeOscillator extends FakeNode {
  frequency = new FakeAudioParam();
  type: OscillatorType = 'sine';
  started = false;
  stopped = false;

  start() {
    this.started = true;
  }

  stop() {
    this.stopped = true;
  }
}

class FakeBufferSource extends FakeNode {
  buffer: AudioBuffer | null = null;
  onended: (() => void) | null = null;
  started = false;
  stopped = false;
  start() {
    this.started = true;
  }
  stop() {
    this.stopped = true;
  }
}

class FakeFilter extends FakeNode {
  frequency = new FakeAudioParam();
  Q = new FakeAudioParam();
  type = '';
}

class FakeAudioContext {
  currentTime = 10;
  destination = new FakeNode();
  state: AudioContextState = 'suspended';
  gains: FakeGain[] = [];
  oscillators: FakeOscillator[] = [];
  resumeCount = 0;
  sampleRate = 24000;
  sources: FakeBufferSource[] = [];
  filters: FakeFilter[] = [];
  createBufferSource() {
    const source = new FakeBufferSource();
    this.sources.push(source);
    return source;
  }
  createBiquadFilter() {
    const filter = new FakeFilter();
    this.filters.push(filter);
    return filter;
  }
  createWaveShaper() {
    return new FakeNode();
  }
  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length) };
  }
  decodeAudioData = vi.fn(async () => ({ duration: 2 }) as AudioBuffer);

  createGain() {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }

  createOscillator() {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  async resume() {
    this.state = 'running';
    this.resumeCount += 1;
  }

  async close() {
    this.state = 'closed';
  }
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
  const context = new FakeAudioContext();
  const manager = new SoundManager(
    () => context as unknown as AudioContext,
    fetchAudio,
  );
  return { context, manager };
};

describe('SoundManager', () => {
  it('starts only after unlock and applies the two independent buses', async () => {
    const { context, manager } = createManager();

    manager.sync(activeState);
    expect(context.oscillators).toHaveLength(0);

    await manager.unlock();

    expect(context.resumeCount).toBe(1);
    expect(context.gains[0]?.gain.value).toBe(0.35);
    expect(context.gains[1]?.gain.value).toBe(0.55);
    expect(context.oscillators).toHaveLength(2);
    expect(context.oscillators.every(({ started }) => started)).toBe(true);
  });

  it('stops environment and mutes both buses while paused or disabled', async () => {
    const { context, manager } = createManager();
    manager.sync(activeState);
    await manager.unlock();
    const initialEnvironment = [...context.oscillators];
    manager.playEffect('terminal_connect');
    const activeEffects = context.oscillators.slice(2);

    manager.sync({ ...activeState, active: false });

    expect(initialEnvironment.every(({ stopped }) => stopped)).toBe(true);
    expect(activeEffects.every(({ stopped }) => stopped)).toBe(true);
    expect(context.gains[0]?.gain.value).toBe(0);
    expect(context.gains[1]?.gain.value).toBe(0);
    manager.playEffect('terminal_connect');
    expect(context.oscillators).toHaveLength(4);

    manager.sync(activeState);
    expect(context.oscillators).toHaveLength(6);
    manager.sync({ ...activeState, enabled: false });
    expect(context.oscillators.slice(4).every(({ stopped }) => stopped)).toBe(
      true,
    );
  });

  it('rebuilds the ambience for restored power and schedules effects', async () => {
    const { context, manager } = createManager();
    manager.sync(activeState);
    await manager.unlock();

    manager.sync({ ...activeState, powered: true });
    expect(context.oscillators).toHaveLength(4);
    expect(context.oscillators[0]?.stopped).toBe(true);
    expect(context.oscillators[2]?.frequency.value).toBe(58);

    manager.playEffect('analysis_complete');
    expect(context.oscillators).toHaveLength(7);
  });

  it('registers only non-verbal effects required by the current design', () => {
    expect(Object.keys(SOUND_CUES)).toEqual([
      'ui_click',
      'text_blip',
      'terminal_connect',
      'power_restore',
      'locker_unlock',
      'locker_error',
      'communication_noise',
      'analysis_complete',
      'transmission',
      'door_unlock',
      'power_relay',
      'carrier_lock',
      'locker_dial',
      'log_patch',
      'packet_snap',
      'voice_scan',
      'transmit_charge',
    ]);
  });
});

describe('three-scene voice playback', () => {
  it('reuses one decoded take for radio opening and near final, and ducks the mix', async () => {
    expect(endingEntries[2]?.text).toBe(introEntries[1].text);
    expect(voiceCues.ending_first_contact?.asset).toBe(
      voiceCues.intro_02?.asset,
    );
    const fetchAudio = vi.fn(async () => new Response(new ArrayBuffer(4)));
    const { manager, context } = createManager(fetchAudio);
    manager.sync(activeState);
    await manager.unlock();
    manager.playVoice('intro_02');
    await vi.waitFor(() =>
      expect(manager.getVoicePlayback().status).toBe('playing'),
    );
    const master = context.sources[0]?.buffer;
    expect(context.filters.map((filter) => filter.type)).toEqual([
      'highpass',
      'lowpass',
    ]);
    expect(context.gains[0]?.gain.value).toBeCloseTo(0.35 * 0.2);
    const oscillators = context.oscillators.length;
    manager.playEffect('text_blip');
    expect(context.oscillators).toHaveLength(oscillators);
    manager.playVoice('ending_first_contact');
    await vi.waitFor(() =>
      expect(manager.getVoicePlayback().status).toBe('playing'),
    );
    expect(context.sources[0]?.stopped).toBe(true);
    expect(context.sources[1]?.stopped).toBe(true);
    expect(context.sources[2]?.buffer).toBe(master);
    expect(fetchAudio).toHaveBeenCalledExactlyOnceWith(
      voiceAssets.first_contact,
      expect.any(Object),
    );
    context.sources[2]?.onended?.();
    expect(manager.getVoicePlayback().status).toBe('idle');
    expect(context.gains[0]?.gain.value).toBe(0.35);
  });

  it('cancels pending reads and ignores late decoded audio after a scene changes', async () => {
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
    expect(context.sources).toHaveLength(0);
    expect(manager.getVoicePlayback().status).toBe('idle');
    manager.playVoice('identity_answer');
    await vi.waitFor(() =>
      expect(context.decodeAudioData).toHaveBeenCalledTimes(2),
    );
    context.state = 'suspended';
    resolveDecode({ duration: 2 } as AudioBuffer);
    await vi.waitFor(() =>
      expect(manager.getVoicePlayback().status).toBe('unavailable'),
    );
    expect(context.sources).toHaveLength(0);
  });

  it('stops on pause, hidden/master mute/voice zero and allows explicit archive playback while paused', async () => {
    const { manager, context } = createManager();
    manager.sync(activeState);
    await manager.unlock();
    manager.playVoice('identity_answer');
    await vi.waitFor(() =>
      expect(manager.getVoicePlayback().status).toBe('playing'),
    );
    expect(context.gains[1]?.gain.value).toBeCloseTo(0.55 * 0.04);
    manager.sync({ ...activeState, paused: true });
    expect(manager.getVoicePlayback().status).toBe('idle');
    manager.playVoice('identity_answer', 'archive');
    await vi.waitFor(() =>
      expect(manager.getVoicePlayback().status).toBe('playing'),
    );
    expect(context.gains[1]?.gain.value).toBe(0);
    for (const state of [
      { ...activeState, enabled: false },
      { ...activeState, active: false },
      { ...activeState, voiceVolume: 0 },
    ]) {
      manager.sync(state);
      manager.playVoice('intro_02');
      expect(manager.getVoicePlayback().status).toBe('idle');
    }
    expect(context.sources.every((source) => source.stopped)).toBe(true);
  });

  it('never fetches unvoiced text, exposes failures without blocking, and permits retry', async () => {
    const fetchAudio = vi.fn(async () => new Response('', { status: 404 }));
    const { manager } = createManager(fetchAudio);
    manager.sync(activeState);
    await manager.unlock();
    manager.playVoice('packet_04');
    manager.playVoice('intro_01');
    expect(fetchAudio).not.toHaveBeenCalled();
    expect(Object.keys(voiceCues)).toEqual([
      'intro_02',
      'identity_answer',
      'ending_first_contact',
    ]);
    manager.playVoice('intro_02');
    await vi.waitFor(() =>
      expect(manager.getVoicePlayback().status).toBe('unavailable'),
    );
    fetchAudio.mockImplementation(async () => new Response(new ArrayBuffer(4)));
    manager.playVoice('intro_02');
    await vi.waitFor(() =>
      expect(manager.getVoicePlayback().status).toBe('playing'),
    );
    manager.dispose();
    expect(manager.getVoicePlayback().status).toBe('idle');
  });
});
