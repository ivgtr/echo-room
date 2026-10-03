import { StrictMode, type ComponentProps } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../../src/app/App';
import { rememberAudioChoice } from '../../src/audio/audioSetup';
import {
  createPowerRestoredProgress,
  loadSettings,
  saveProgress,
  saveSettings,
} from '../../src/game/save/saveManager';
import { puzzleIds } from '../../src/game/puzzles/storyPuzzles';
import { getRestoredNarrativeHistory } from '../../src/ui/narrative/narrativeArchive';

type ScreenProps = ComponentProps<
  typeof import('../../src/ui/GameScreen').GameScreen
>;
type TitleProps = ComponentProps<
  typeof import('../../src/ui/TitleScreen').TitleScreen
>;
const harness = vi.hoisted(() => ({
  screen: null as ScreenProps | null,
  playback: { entryId: null, status: 'idle' as const },
  playVoice: vi.fn<
    (entryId: string, scope?: 'scene' | 'archive') => () => void
  >(() => vi.fn()),
  stopVoice: vi.fn(),
}));
vi.mock('../../src/app/environment', () => ({
  supportsRequiredEnvironment: () => true,
}));
vi.mock('../../src/audio/soundManager', () => ({
  soundManager: {
    subscribeVoice: () => () => {},
    getVoicePlayback: () => harness.playback,
    sync: vi.fn(),
    unlock: async () => true,
    playEffect: vi.fn(),
    playVoice: harness.playVoice,
    stopVoice: harness.stopVoice,
  },
}));
vi.mock('../../src/ui/GameScreen', () => ({
  GameScreen: (props: ScreenProps) => {
    harness.screen = props;
    return null;
  },
}));
vi.mock('../../src/ui/TitleScreen', () => ({
  TitleScreen: (props: TitleProps) => (
    <>
      <button onClick={props.onStart}>START</button>
      {props.onContinue && <button onClick={props.onContinue}>CONTINUE</button>}
    </>
  ),
}));

const game = () => harness.screen!;
const readIds = () => game().narrativeHistory.map(({ id }) => id);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  saveSettings({ ...loadSettings(), soundEnabled: true, motionReduced: true });
  rememberAudioChoice(localStorage);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('display-driven scene narration', () => {
  it('speaks a first displayed line once in StrictMode and keeps queued power replies unread', () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    fireEvent.click(screen.getByText('START'));
    act(() => game().onDialogueAdvance());
    expect(harness.playVoice).toHaveBeenCalledExactlyOnceWith('intro_02');
    act(() => game().onSystemToggle());
    act(() => game().onSystemToggle());
    expect(harness.playVoice).toHaveBeenCalledTimes(1);
    const visibility = vi.spyOn(document, 'visibilityState', 'get');
    visibility.mockReturnValue('hidden');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    visibility.mockReturnValue('visible');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    visibility.mockRestore();
    expect(harness.playVoice).toHaveBeenCalledTimes(1);
    for (let index = 1; index < 7; index += 1)
      act(() => game().onDialogueAdvance());
    act(() => game().onHotspotSelected('hotspot_breaker'));
    act(() =>
      game().onPuzzleSubmit('puzzle_power_route', [
        'terminal',
        'intercom',
        'buffer',
      ]),
    );
    expect(game().powerRestored).toBe(true);
    expect(readIds()).toContain('power_direction');
    expect(readIds()).not.toContain('power_answer');
    harness.playVoice.mockClear();
    act(() => game().onSystemToggle());
    act(() => game().onReplayVoice('power_answer'));
    expect(harness.playVoice).not.toHaveBeenCalled();
    act(() => game().onSystemToggle());
    act(() => game().onEventNarrativeAdvance());
    expect(readIds()).not.toContain('power_answer');
    act(() => game().onEventNarrativeAdvance());
    expect(readIds()).toContain('power_answer');
    expect(harness.playVoice).toHaveBeenCalledExactlyOnceWith('power_answer');
    act(() =>
      game().onPuzzleSubmit('puzzle_power_route', [
        'terminal',
        'intercom',
        'buffer',
      ]),
    );
    expect(game().eventNarrative?.id).toBe('power_answer');
    expect(harness.playVoice).toHaveBeenCalledTimes(1);
  });

  it('does not voice hidden or revisited PACKET lines and reconstructs only a completed frame', async () => {
    const progress = createPowerRestoredProgress({
      storyStage: 'puzzle_packet_repair',
      completedPuzzleIds: puzzleIds.slice(0, 4),
    });
    saveProgress(progress);
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    fireEvent.click(screen.getByText('CONTINUE'));
    expect(readIds().some((id) => id.startsWith('packet_'))).toBe(false);
    expect(harness.playVoice).not.toHaveBeenCalled();
    act(() => game().onHotspotSelected('hotspot_terminal'));
    act(() => game().onTerminalMenu('audio'));
    act(() => game().onPacketEntryChange('packet_01'));
    expect(harness.playVoice).toHaveBeenCalledExactlyOnceWith('packet_01');
    expect(readIds()).not.toContain('packet_04');
    act(() => game().onTerminalMenu('log'));
    act(() => game().onPacketEntryChange(null));
    act(() => game().onTerminalMenu('audio'));
    act(() => game().onPacketEntryChange('packet_01'));
    act(() => game().onHintReveal());
    expect(harness.playVoice).toHaveBeenCalledTimes(1);
    for (const entryId of ['packet_02', 'packet_03', 'packet_04'])
      act(() => game().onPacketEntryChange(entryId));
    expect(harness.playVoice.mock.calls.map(([id]) => id)).toEqual([
      'packet_01',
      'packet_02',
      'packet_03',
      'packet_04',
    ]);
    act(() =>
      game().onPuzzleSubmit('puzzle_packet_repair', ['c', 'd', 'a', 'b']),
    );
    expect(game().storyStage).toBe('puzzle_voiceprint_calibration');
    const restored = getRestoredNarrativeHistory({
      ...progress,
      completedPuzzleIds: puzzleIds.slice(0, 5),
      storyStage: 'puzzle_voiceprint_calibration',
    });
    expect(
      restored.filter(({ id }) => /^packet_0/.test(id)).map(({ id }) => id),
    ).toEqual(['packet_01', 'packet_02', 'packet_03', 'packet_04']);
    expect(restored.some(({ id }) => id === 'identity_answer')).toBe(false);
    act(() => game().onEventNarrativeAdvance());
    act(() => game().onEventNarrativeAdvance());
    act(() => game().onHotspotSelected('hotspot_terminal'));
    act(() => game().onTerminalMenu('audio'));
    await act(async () => game().onReplayVoice('packet_04'));
    expect(harness.playVoice).toHaveBeenLastCalledWith('packet_04', 'scene');
    const stopped = harness.stopVoice.mock.calls.length;
    act(() => game().onTerminalMenu('log'));
    expect(harness.stopVoice.mock.calls.length).toBeGreaterThan(stopped);
  });
});
