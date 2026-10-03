import {
  voiceAssets,
  voiceCues,
  type VoiceAssetId,
  type VoicePlayback,
} from './voiceManifest';

export type SoundEffectId =
  | 'ui_click'
  | 'text_blip'
  | 'terminal_connect'
  | 'power_restore'
  | 'locker_unlock'
  | 'locker_error'
  | 'communication_noise'
  | 'analysis_complete'
  | 'transmission'
  | 'door_unlock'
  | 'power_relay'
  | 'carrier_lock'
  | 'locker_dial'
  | 'log_patch'
  | 'packet_snap'
  | 'voice_scan'
  | 'transmit_charge';

export type SoundState = {
  active: boolean;
  enabled: boolean;
  effectsVolume: number;
  voiceVolume: number;
  paused?: boolean;
  environmentVolume: number;
  powered: boolean;
  powerPhase: 'normal' | 'low' | 'critical' | 'reserve';
};

export type EffectScope = 'world' | 'dialogue';

type Tone = {
  frequency: number;
  delay: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
};

export const SOUND_CUES: Readonly<Record<SoundEffectId, readonly Tone[]>> = {
  ui_click: [
    { frequency: 760, delay: 0, duration: 0.028, gain: 0.026, type: 'square' },
  ],
  text_blip: [
    { frequency: 520, delay: 0, duration: 0.022, gain: 0.018, type: 'square' },
  ],
  terminal_connect: [
    { frequency: 480, delay: 0, duration: 0.06, gain: 0.05 },
    { frequency: 720, delay: 0.08, duration: 0.09, gain: 0.04 },
  ],
  power_restore: [
    { frequency: 52, delay: 0, duration: 0.28, gain: 0.09, type: 'square' },
    {
      frequency: 104,
      delay: 0.18,
      duration: 0.34,
      gain: 0.065,
      type: 'triangle',
    },
    { frequency: 208, delay: 0.42, duration: 0.42, gain: 0.045 },
  ],
  locker_unlock: [
    { frequency: 110, delay: 0, duration: 0.12, gain: 0.08, type: 'square' },
    {
      frequency: 165,
      delay: 0.1,
      duration: 0.18,
      gain: 0.07,
      type: 'triangle',
    },
  ],
  locker_error: [
    { frequency: 90, delay: 0, duration: 0.11, gain: 0.06, type: 'sawtooth' },
    {
      frequency: 72,
      delay: 0.13,
      duration: 0.14,
      gain: 0.05,
      type: 'sawtooth',
    },
  ],
  communication_noise: [
    { frequency: 1040, delay: 0, duration: 0.04, gain: 0.035, type: 'square' },
    {
      frequency: 620,
      delay: 0.06,
      duration: 0.03,
      gain: 0.025,
      type: 'square',
    },
    { frequency: 880, delay: 0.11, duration: 0.08, gain: 0.03, type: 'square' },
  ],
  analysis_complete: [
    { frequency: 320, delay: 0, duration: 0.08, gain: 0.04 },
    { frequency: 480, delay: 0.1, duration: 0.08, gain: 0.04 },
    { frequency: 640, delay: 0.2, duration: 0.16, gain: 0.05 },
  ],
  transmission: [
    { frequency: 180, delay: 0, duration: 0.22, gain: 0.05, type: 'triangle' },
    {
      frequency: 360,
      delay: 0.2,
      duration: 0.2,
      gain: 0.045,
      type: 'triangle',
    },
    { frequency: 720, delay: 0.38, duration: 0.3, gain: 0.035 },
  ],
  door_unlock: [
    { frequency: 74, delay: 0, duration: 0.28, gain: 0.09, type: 'square' },
    {
      frequency: 111,
      delay: 0.24,
      duration: 0.38,
      gain: 0.07,
      type: 'triangle',
    },
  ],
  power_relay: [
    { frequency: 82, delay: 0, duration: 0.08, gain: 0.06, type: 'square' },
  ],
  carrier_lock: [
    { frequency: 620, delay: 0, duration: 0.05, gain: 0.035 },
    { frequency: 930, delay: 0.05, duration: 0.07, gain: 0.025 },
  ],
  locker_dial: [
    { frequency: 145, delay: 0, duration: 0.035, gain: 0.05, type: 'square' },
  ],
  log_patch: [
    { frequency: 260, delay: 0, duration: 0.045, gain: 0.04, type: 'triangle' },
  ],
  packet_snap: [
    { frequency: 410, delay: 0, duration: 0.04, gain: 0.04, type: 'square' },
    { frequency: 540, delay: 0.04, duration: 0.05, gain: 0.028 },
  ],
  voice_scan: [
    { frequency: 280, delay: 0, duration: 0.06, gain: 0.035 },
    { frequency: 360, delay: 0.06, duration: 0.06, gain: 0.035 },
  ],
  transmit_charge: [
    { frequency: 120, delay: 0, duration: 0.12, gain: 0.05, type: 'triangle' },
    {
      frequency: 240,
      delay: 0.1,
      duration: 0.12,
      gain: 0.04,
      type: 'triangle',
    },
  ],
};

const DEFAULT_STATE: SoundState = {
  active: false,
  enabled: true,
  effectsVolume: 100,
  voiceVolume: 85,
  environmentVolume: 70,
  powered: false,
  powerPhase: 'normal',
};

type AudioContextFactory = () => AudioContext;
type EnvironmentSource = {
  oscillator: OscillatorNode;
  gain: GainNode;
};
type EffectSource = EnvironmentSource & { scope: EffectScope };

export class SoundManager {
  private context: AudioContext | null = null;
  private effectsBus: GainNode | null = null;
  private voiceBus: GainNode | null = null;
  private voiceBufferCache = new Map<VoiceAssetId, AudioBuffer>();
  private voiceGeneration = 0;
  private voiceAbort: AbortController | null = null;
  private voiceNodes: AudioNode[] = [];
  private voiceSources: AudioBufferSourceNode[] = [];
  private voiceScope: 'scene' | 'archive' = 'scene';
  private voiceDucking = false;
  private revealDucking = false;
  private voicePlayback: VoicePlayback = { entryId: null, status: 'idle' };
  private voiceListeners = new Set<() => void>();

  readonly getVoicePlayback = () => this.voicePlayback;
  readonly subscribeVoice = (listener: () => void) => {
    this.voiceListeners.add(listener);
    return () => this.voiceListeners.delete(listener);
  };
  private environmentBus: GainNode | null = null;
  private environmentSources: EnvironmentSource[] = [];
  private effectSources = new Set<EffectSource>();
  private state: SoundState = DEFAULT_STATE;
  private environmentKey: string | null = null;

  constructor(
    private readonly createContext: AudioContextFactory = () =>
      new AudioContext(),
    private readonly fetchAudio: typeof fetch = (...args) => fetch(...args),
  ) {}

  async unlock(): Promise<boolean> {
    this.ensureContext();
    if (this.context && this.context.state !== 'running') {
      await this.context.resume();
    }
    this.syncBuses();
    this.syncEnvironment();
    // A resolved resume alone is not proof that the browser is playing audio.
    return this.context?.state === 'running';
  }

  sync(nextState: SoundState) {
    this.state = nextState;
    if (!nextState.active || !nextState.enabled || nextState.paused)
      this.stopEffects();
    if (!this.canPlayVoice(this.voiceScope)) this.stopVoice();
    this.syncBuses();
    this.syncEnvironment();
  }

  playEffect(
    effectId: SoundEffectId,
    scope: EffectScope = effectId === 'text_blip' ? 'dialogue' : 'world',
  ) {
    if (
      scope === 'dialogue' &&
      (this.voiceDucking ||
        (effectId !== 'text_blip' && this.voicePlayback.status === 'loading'))
    )
      return;
    this.playTones(SOUND_CUES[effectId], scope);
  }

  dispose() {
    this.stopVoice();
    this.voiceBufferCache.clear();
    this.stopEnvironment();
    this.stopEffects();
    const context = this.context;
    this.context = null;
    this.effectsBus = null;
    this.voiceBus = null;
    this.environmentBus = null;
    if (context) {
      context.onstatechange = null;
      void context.close();
    }
  }

  private ensureContext() {
    if (this.context) return;
    this.context = this.createContext();
    this.context.onstatechange = () => {
      if (this.context && this.context.state !== 'running') {
        this.stopVoice();
        this.stopEffects();
        this.stopEnvironment();
      }
    };
    this.effectsBus = this.context.createGain();
    this.environmentBus = this.context.createGain();
    this.voiceBus = this.context.createGain();
    this.voiceBus.connect(this.context.destination);
    this.effectsBus.connect(this.context.destination);
    this.environmentBus.connect(this.context.destination);
  }

  private syncBuses() {
    if (!this.effectsBus || !this.environmentBus || !this.voiceBus) return;
    const audible = this.state.active && this.state.enabled;
    const worldAudible = audible && !this.state.paused;
    this.setLevel(
      this.effectsBus,
      worldAudible
        ? normalizeVolume(this.state.effectsVolume) *
            (this.voiceDucking ? 0.2 : 1)
        : 0,
    );
    this.setLevel(
      this.environmentBus,
      worldAudible
        ? normalizeVolume(this.state.environmentVolume) *
            (this.voiceDucking ? (this.revealDucking ? 0.04 : 0.2) : 1)
        : 0,
    );
    // Masters retain their watermark and peaks; headroom is applied at playback.
    this.setLevel(
      this.voiceBus,
      audible ? normalizeVolume(this.state.voiceVolume) * 0.65 : 0,
    );
  }

  private setLevel(node: GainNode, level: number) {
    const now = this.context!.currentTime;
    node.gain.cancelScheduledValues(now);
    node.gain.setTargetAtTime(level, now, 0.04);
  }

  private canPlayVoice(scope: 'scene' | 'archive') {
    return (
      this.state.active &&
      this.state.enabled &&
      this.state.voiceVolume > 0 &&
      (!this.state.paused || scope === 'archive') &&
      this.context?.state === 'running'
    );
  }

  private setVoicePlayback(playback: VoicePlayback) {
    this.voicePlayback = playback;
    for (const listener of this.voiceListeners) listener();
  }

  /** The caller must pass a currently shown or explicitly selected, read entry. */
  playVoice(entryId: string, scope: 'scene' | 'archive' = 'scene'): () => void {
    const cue = voiceCues[entryId];
    this.stopVoice();
    if (!cue || !this.canPlayVoice(scope)) return () => {};
    const generation = this.voiceGeneration;
    this.voiceScope = scope;
    const controller = new AbortController();
    this.voiceAbort = controller;
    this.setVoicePlayback({ entryId, status: 'loading' });
    // A slow/unavailable asset never holds a subtitle or a game transition open.
    const timeout = setTimeout(() => {
      if (generation !== this.voiceGeneration) return;
      this.stopVoice();
      this.setVoicePlayback({ entryId, status: 'unavailable' });
    }, 8000);
    void (async () => {
      try {
        let buffer = this.voiceBufferCache.get(cue.asset);
        if (!buffer) {
          const response = await this.fetchAudio(voiceAssets[cue.asset], {
            signal: controller.signal,
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
          });
          if (!response.ok) throw new Error('Voice asset unavailable');
          const bytes = await response.arrayBuffer();
          if (generation !== this.voiceGeneration || controller.signal.aborted)
            return;
          buffer = await this.context!.decodeAudioData(bytes);
          if (generation !== this.voiceGeneration || controller.signal.aborted)
            return;
          this.voiceBufferCache.set(cue.asset, buffer);
        }
        if (generation !== this.voiceGeneration || controller.signal.aborted)
          return;
        if (!this.canPlayVoice(scope)) {
          this.stopVoice();
          this.setVoicePlayback({ entryId, status: 'unavailable' });
          return;
        }
        this.voiceAbort = null;
        const context = this.context!;
        const source = context.createBufferSource();
        source.buffer = buffer;
        this.voiceSources = [source];
        const envelope = context.createGain();
        this.voiceNodes = [source, envelope];
        const now = context.currentTime;
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(1, now + 0.02);
        envelope.gain.setValueAtTime(
          1,
          now + Math.max(0.02, buffer.duration - 0.04),
        );
        envelope.gain.linearRampToValueAtTime(0, now + buffer.duration);
        envelope.connect(this.voiceBus!);
        if (cue.treatment === 'radio') {
          const highpass = context.createBiquadFilter();
          highpass.type = 'highpass';
          highpass.frequency.value = 260;
          highpass.Q.value = 0.6;
          const lowpass = context.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = 3400;
          lowpass.Q.value = 0.6;
          const warmth = context.createWaveShaper();
          warmth.curve = Float32Array.from({ length: 1024 }, (_, index) => {
            const value = (index / 1023) * 2 - 1;
            return Math.tanh(value * 1.15) / 1.15;
          });
          source
            .connect(highpass)
            .connect(lowpass)
            .connect(warmth)
            .connect(envelope);
          const noise = context.createBufferSource();
          const noiseBuffer = context.createBuffer(
            1,
            Math.ceil(context.sampleRate * buffer.duration),
            context.sampleRate,
          );
          const samples = noiseBuffer.getChannelData(0);
          let seed = 21;
          for (let index = 0; index < samples.length; index += 1) {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            samples[index] = ((seed / 0xffffffff) * 2 - 1) * 0.003;
          }
          noise.buffer = noiseBuffer;
          noise.connect(highpass);
          this.voiceSources.push(noise);
          this.voiceNodes.push(highpass, lowpass, warmth, noise);
        } else source.connect(envelope);
        // End even already scheduled dialogue tails before the first voice sample.
        // Device feedback and the voice's own radio noise remain independent.
        this.stopEffects('dialogue');
        this.voiceDucking = true;
        this.revealDucking = Boolean(cue.reveal);
        this.syncBuses();
        this.setVoicePlayback({ entryId, status: 'playing' });
        source.onended = () => {
          if (generation === this.voiceGeneration) this.stopVoice();
        };
        for (const current of this.voiceSources) current.start(now);
      } catch {
        if (generation === this.voiceGeneration) {
          this.stopVoice();
          this.setVoicePlayback({ entryId, status: 'unavailable' });
        }
      } finally {
        clearTimeout(timeout);
      }
    })();
    return () => {
      if (generation === this.voiceGeneration) this.stopVoice();
    };
  }

  stopVoice() {
    this.voiceGeneration += 1;
    this.voiceAbort?.abort();
    this.voiceAbort = null;
    for (const source of this.voiceSources) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        /* The source may have ended already. */
      }
    }
    for (const node of this.voiceNodes) node.disconnect();
    this.voiceSources = [];
    this.voiceNodes = [];
    this.voiceDucking = false;
    this.revealDucking = false;
    if (this.voicePlayback.status !== 'idle')
      this.setVoicePlayback({ entryId: null, status: 'idle' });
    this.syncBuses();
  }

  private syncEnvironment() {
    const shouldPlay =
      this.state.active &&
      !this.state.paused &&
      this.state.enabled &&
      this.state.environmentVolume > 0 &&
      this.context?.state === 'running';
    if (!shouldPlay) {
      this.stopEnvironment();
      return;
    }
    if (
      this.environmentSources.length > 0 &&
      this.environmentKey === `${this.state.powered}:${this.state.powerPhase}`
    )
      return;

    this.stopEnvironment();
    if (!this.context || !this.environmentBus) return;
    const phaseOffset = { normal: 0, low: -2, critical: -6, reserve: -13 }[
      this.state.powerPhase
    ];
    const baseFrequency = (this.state.powered ? 58 : 43) + phaseOffset;
    const phaseGain = { normal: 1, low: 0.9, critical: 0.7, reserve: 0.48 }[
      this.state.powerPhase
    ];
    const tones: readonly [number, OscillatorType, number][] = [
      [baseFrequency, 'sine', 0.025 * phaseGain],
      [baseFrequency * 2.01, 'triangle', 0.009 * phaseGain],
    ];
    this.environmentSources = tones.map(([frequency, type, level]) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gain.gain.value = level;
      oscillator.connect(gain).connect(this.environmentBus!);
      oscillator.start();
      return { oscillator, gain };
    });
    this.environmentKey = `${this.state.powered}:${this.state.powerPhase}`;
  }

  private stopEnvironment() {
    for (const { oscillator, gain } of this.environmentSources) {
      try {
        oscillator.stop();
      } catch {
        // A stopped Web Audio source cannot be stopped again.
      }
      oscillator.disconnect();
      gain.disconnect();
    }
    this.environmentSources = [];
    this.environmentKey = null;
  }

  private playTones(tones: readonly Tone[], scope: EffectScope) {
    if (
      !this.state.active ||
      this.state.paused ||
      !this.state.enabled ||
      this.state.effectsVolume <= 0 ||
      !this.context ||
      !this.effectsBus ||
      this.context.state !== 'running'
    )
      return;

    for (const tone of tones) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const startAt = this.context.currentTime + tone.delay;
      const stopAt = startAt + tone.duration;
      oscillator.frequency.value = tone.frequency;
      oscillator.type = tone.type ?? 'sine';
      gain.gain.setValueAtTime(tone.gain, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, stopAt);
      oscillator.connect(gain).connect(this.effectsBus);
      const source = { oscillator, gain, scope };
      this.effectSources.add(source);
      oscillator.onended = () => {
        this.effectSources.delete(source);
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(startAt);
      oscillator.stop(stopAt);
    }
  }

  private stopEffects(scope?: EffectScope) {
    for (const source of this.effectSources) {
      if (scope && source.scope !== scope) continue;
      const { oscillator, gain } = source;
      this.effectSources.delete(source);
      oscillator.onended = null;
      try {
        oscillator.stop();
      } catch {
        // A completed Web Audio source cannot be stopped again.
      }
      oscillator.disconnect();
      gain.disconnect();
    }
  }
}

const normalizeVolume = (value: number) =>
  Math.min(1, Math.max(0, value / 100));

export const soundManager = new SoundManager();
