import { describe, expect, it } from 'vitest';

import {
  SOUND_CUES,
  SoundManager,
  type SoundState,
} from '../../src/audio/soundManager';

class FakeAudioParam {
  value = 1;

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

class FakeAudioContext {
  currentTime = 10;
  destination = new FakeNode();
  state: AudioContextState = 'suspended';
  gains: FakeGain[] = [];
  oscillators: FakeOscillator[] = [];
  resumeCount = 0;

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
  environmentVolume: 55,
  powered: false,
};

const createManager = () => {
  const context = new FakeAudioContext();
  const manager = new SoundManager(() => context as unknown as AudioContext);
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
    ]);
  });
});
