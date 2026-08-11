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
  | 'door_unlock';

export type SoundState = {
  active: boolean;
  enabled: boolean;
  effectsVolume: number;
  environmentVolume: number;
  powered: boolean;
};

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
};

const DEFAULT_STATE: SoundState = {
  active: false,
  enabled: true,
  effectsVolume: 100,
  environmentVolume: 70,
  powered: false,
};

type AudioContextFactory = () => AudioContext;
type EnvironmentSource = {
  oscillator: OscillatorNode;
  gain: GainNode;
};
type EffectSource = EnvironmentSource;

export class SoundManager {
  private context: AudioContext | null = null;
  private effectsBus: GainNode | null = null;
  private environmentBus: GainNode | null = null;
  private environmentSources: EnvironmentSource[] = [];
  private effectSources = new Set<EffectSource>();
  private state: SoundState = DEFAULT_STATE;
  private environmentPowered: boolean | null = null;

  constructor(
    private readonly createContext: AudioContextFactory = () =>
      new AudioContext(),
  ) {}

  async unlock() {
    this.ensureContext();
    if (this.context?.state === 'suspended') await this.context.resume();
    this.syncBuses();
    this.syncEnvironment();
  }

  sync(nextState: SoundState) {
    this.state = nextState;
    if (!nextState.active || !nextState.enabled) this.stopEffects();
    this.syncBuses();
    this.syncEnvironment();
  }

  playEffect(effectId: SoundEffectId) {
    this.playTones(SOUND_CUES[effectId]);
  }

  dispose() {
    this.stopEnvironment();
    this.stopEffects();
    const context = this.context;
    this.context = null;
    this.effectsBus = null;
    this.environmentBus = null;
    if (context) void context.close();
  }

  private ensureContext() {
    if (this.context) return;
    this.context = this.createContext();
    this.effectsBus = this.context.createGain();
    this.environmentBus = this.context.createGain();
    this.effectsBus.connect(this.context.destination);
    this.environmentBus.connect(this.context.destination);
  }

  private syncBuses() {
    if (!this.effectsBus || !this.environmentBus) return;
    const audible = this.state.active && this.state.enabled;
    this.effectsBus.gain.value = audible
      ? normalizeVolume(this.state.effectsVolume)
      : 0;
    this.environmentBus.gain.value = audible
      ? normalizeVolume(this.state.environmentVolume)
      : 0;
  }

  private syncEnvironment() {
    const shouldPlay =
      this.state.active &&
      this.state.enabled &&
      this.state.environmentVolume > 0 &&
      this.context?.state === 'running';
    if (!shouldPlay) {
      this.stopEnvironment();
      return;
    }
    if (
      this.environmentSources.length > 0 &&
      this.environmentPowered === this.state.powered
    )
      return;

    this.stopEnvironment();
    if (!this.context || !this.environmentBus) return;
    const baseFrequency = this.state.powered ? 58 : 43;
    const tones: readonly [number, OscillatorType, number][] = [
      [baseFrequency, 'sine', 0.025],
      [baseFrequency * 2.01, 'triangle', 0.009],
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
    this.environmentPowered = this.state.powered;
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
    this.environmentPowered = null;
  }

  private playTones(tones: readonly Tone[]) {
    if (
      !this.state.active ||
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
      const source = { oscillator, gain };
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

  private stopEffects() {
    for (const { oscillator, gain } of this.effectSources) {
      oscillator.onended = null;
      try {
        oscillator.stop();
      } catch {
        // A completed Web Audio source cannot be stopped again.
      }
      oscillator.disconnect();
      gain.disconnect();
    }
    this.effectSources.clear();
  }
}

const normalizeVolume = (value: number) =>
  Math.min(1, Math.max(0, value / 100));

export const soundManager = new SoundManager();
