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
  // JSDOM does not implement the top layer. Native focus/inert behavior is E2E-tested.
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

describe('cinematic title', () => {
  it('offers a quiet title, not a settings dashboard', () => {
    const p = props();
    render(<TitleScreen {...p} />);
    expect(screen.getByRole('heading', { name: 'ECHO ROOM' })).toBeVisible();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ゲーム開始' }));
    expect(p.onStart).toHaveBeenCalledOnce();
    expect(p.onSoundUnlock).not.toHaveBeenCalled();
  });
  it('protects a valid save when choosing a new game', () => {
    const p = props();
    render(<TitleScreen {...p} saveStatus="valid" onContinue={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'ゲーム開始' }));
    expect(p.onStart).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '最初から始める' }));
    expect(p.onStart).toHaveBeenCalledOnce();
  });
  it('puts erase behind settings and a separate confirmation', () => {
    const p = props();
    render(<TitleScreen {...p} saveStatus="valid" />);
    expect(
      screen.queryByRole('button', { name: '保存データを消去' }),
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '設定' }));
    fireEvent.click(screen.getByRole('button', { name: '保存データを消去' }));
    expect(
      screen.getByRole('dialog', { name: '保存データ消去の確認' }),
    ).toBeVisible();
    expect(p.onDeleteSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '消去する' }));
    expect(p.onDeleteSave).toHaveBeenCalledOnce();
  });
  it('keeps erase failure visible and does not close the confirmation', () => {
    render(
      <TitleScreen
        {...props()}
        saveStatus="corrupt"
        onDeleteSave={() => false}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'このデータを消すまで新しい進行は保存されません',
    );
    fireEvent.click(screen.getByRole('button', { name: '設定' }));
    fireEvent.click(screen.getByRole('button', { name: '保存データを消去' }));
    fireEvent.click(screen.getByRole('button', { name: '消去する' }));
    expect(screen.getByRole('alert')).toHaveTextContent('消去できません');
  });
  it('keeps the title usable when the decorative background fails', () => {
    const p = props();
    const { container } = render(<TitleScreen {...p} />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'ゲーム開始' }));
    expect(p.onStart).toHaveBeenCalledOnce();
  });
});

describe('first-visit sound choice', () => {
  it('does not initialize audio before an explicit choice', () => {
    const p = props();
    render(<TitleScreen {...p} audioChoiceMade={false} />);
    expect(
      screen.getByRole('dialog', { name: 'サウンドを有効にしますか' }),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'ゲーム開始' })).toBeNull();
    expect(p.onSoundUnlock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '音なしで進む' }));
    expect(p.onSoundChoice).toHaveBeenCalledExactlyOnceWith(false);
    expect(screen.getByRole('button', { name: 'ゲーム開始' })).toHaveFocus();
  });
  it('accepts sound only after the context actually starts', async () => {
    const p = props();
    render(<TitleScreen {...p} audioChoiceMade={false} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '音ありで進む' }));
    });
    expect(p.onSoundUnlock).toHaveBeenCalledOnce();
    expect(p.onSoundChoice).toHaveBeenCalledExactlyOnceWith(true);
    expect(screen.queryByRole('dialog')).toBeNull();
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
  it('times out and offers retry or silence', async () => {
    vi.useFakeTimers();
    render(
      <TitleScreen
        {...props()}
        audioChoiceMade={false}
        onSoundUnlock={() => new Promise(() => {})}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '音ありで進む' }));
    await act(async () => vi.advanceTimersByTime(3000));
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.getByRole('button', { name: '音ありで進む' })).toBeVisible();
  });
  it('uses Escape as the silent first-visit route', () => {
    const p = props();
    render(<TitleScreen {...p} audioChoiceMade={false} />);
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { cancelable: true }),
    );
    expect(p.onSoundChoice).toHaveBeenCalledExactlyOnceWith(false);
    expect(screen.getByRole('button', { name: 'ゲーム開始' })).toHaveFocus();
  });
});
