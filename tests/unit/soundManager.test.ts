import { describe, expect, it, vi } from 'vitest';

import { SoundManager, type SoundState } from '../../src/audio/soundManager';

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
  environmentVolume: 55,
  powered: false,
  powerPhase: 'normal',
};

const createManager = () => {
  const context = {
    currentTime: 10,
    sampleRate: 24000,
    state: 'suspended' as AudioContextState,
    destination: new FakeNode(),
    createGain: () => new FakeNode(),
    createOscillator: vi.fn(() => new FakeNode()),
    async resume() {
      this.state = 'running';
    },
    async close() {
      this.state = 'closed';
    },
  };
  return {
    context,
    manager: new SoundManager(() => context as unknown as AudioContext),
  };
};

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

  it('keeps text and device cues, and stops all sound while inactive', async () => {
    const { manager, context } = createManager();
    manager.sync({ ...activeState, environmentVolume: 0 });
    await manager.unlock();
    manager.playEffect('text_blip');
    manager.playEffect('ui_click');
    manager.playEffect('packet_snap');
    const sources = context.createOscillator.mock.results.map(
      ({ value }) => value,
    );
    expect(sources.length).toBeGreaterThan(2);
    for (const source of sources) expect(source.start).toHaveBeenCalled();
    manager.sync({ ...activeState, active: false });
    for (const source of sources) {
      expect(source.stop).toHaveBeenLastCalledWith();
      expect(source.disconnect).toHaveBeenCalled();
    }
    const count = sources.length;
    manager.playEffect('ui_click');
    expect(context.createOscillator).toHaveBeenCalledTimes(count);
    manager.sync({ ...activeState, environmentVolume: 0 });
    manager.playEffect('text_blip');
    expect(context.createOscillator).toHaveBeenCalledTimes(count + 1);
    manager.dispose();
  });
});
