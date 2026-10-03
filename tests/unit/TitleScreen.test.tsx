import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TitleScreen } from '../../src/ui/TitleScreen';

const props = () => ({
  onStart: vi.fn(),
  saveStatus: 'empty' as const,
  onDeleteSave: vi.fn(() => true),
  soundEnabled: false,
  audioChoiceMade: true,
  onSoundChoice: vi.fn(),
  onSoundUnlock: vi.fn(async () => true),
  motionReduced: true,
  onToggleMotion: vi.fn(),
});

beforeEach(() => {
  // JSDOM does not implement the top layer. Native focus/inert behavior needs a real browser.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute('open');
    },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('TitleScreen', () => {
  it('protects a valid save when choosing a new game', () => {
    const p = props();
    render(<TitleScreen {...p} saveStatus="valid" onContinue={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'ゲーム開始' }));
    expect(p.onStart).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '最初から始める' }));
    expect(p.onStart).toHaveBeenCalledOnce();
  });

  it('allows silent continuation after a failed resume', async () => {
    const p = props();
    render(
      <TitleScreen
        {...p}
        audioChoiceMade={false}
        onSoundUnlock={async () => false}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '音ありで進む' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      '音を開始できませんでした',
    );
    fireEvent.click(screen.getByRole('button', { name: '音なしで進む' }));
    expect(p.onSoundChoice).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('ignores late success after the user selects mute', async () => {
    let resolve!: (value: boolean) => void;
    const p = props();
    render(
      <TitleScreen
        {...p}
        audioChoiceMade={false}
        onSoundUnlock={() =>
          new Promise((done) => {
            resolve = done;
          })
        }
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '音ありで進む' }));
    fireEvent.click(screen.getByRole('button', { name: '音なしで進む' }));
    await act(async () => resolve(true));
    expect(p.onSoundChoice).toHaveBeenCalledExactlyOnceWith(false);
  });
});
