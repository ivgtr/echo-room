import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NarrativePanel } from '../../src/ui/narrative/NarrativePanel';
import {
  getCharacterDelay,
  shouldPlayTextBlip,
} from '../../src/ui/narrative/narrativeTiming';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('NarrativePanel text reveal', () => {
  it('reveals text at the selected speed and rate-limits generic blips', () => {
    vi.useFakeTimers();
    const onTextBlip = vi.fn();
    const { container } = render(
      <NarrativePanel
        kind="communication"
        text="AB。"
        advanceLabel="次の文章へ"
        onAdvance={vi.fn()}
        textSpeed="normal"
        motionReduced={false}
        onTextBlip={onTextBlip}
      />,
    );
    const text = container.querySelector('.narrative-text');
    const reveal = container.querySelector('.narrative-reveal');
    const advanceSurface = screen.getByRole('button', {
      name: '文章をすべて表示',
    });

    expect(advanceSurface).toHaveClass('narrative-advance-surface');
    expect(
      container.querySelector('.narrative-actions'),
    ).not.toBeInTheDocument();
    expect(text).toHaveAttribute('data-text-complete', 'false');
    expect(reveal).toHaveTextContent('');
    act(() => vi.advanceTimersByTime(50));
    expect(reveal).toHaveTextContent('A');
    expect(onTextBlip).toHaveBeenCalledOnce();
    act(() => vi.runAllTimers());
    expect(reveal).toHaveTextContent('AB。');
    expect(text).toHaveAttribute('data-text-complete', 'true');
    expect(onTextBlip).toHaveBeenCalledOnce();
  });

  it('keeps the skip action separate from the full-screen advance surface', () => {
    const onAdvance = vi.fn();
    const onSkip = vi.fn();
    render(
      <NarrativePanel
        kind="communication"
        text="既読の通信"
        advanceLabel="次の文章へ"
        onAdvance={onAdvance}
        secondaryAction={{ label: '既読会話をスキップ', onSelect: onSkip }}
        textSpeed="normal"
        motionReduced
        onTextBlip={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '既読会話をスキップ' }));
    expect(onSkip).toHaveBeenCalledOnce();
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('uses the first early activation to complete text and the next to advance', () => {
    vi.useFakeTimers();
    const onAdvance = vi.fn();
    const { container } = render(
      <NarrativePanel
        kind="monologue"
        text="まだ表示中の文章"
        advanceLabel="次の文章へ"
        onAdvance={onAdvance}
        textSpeed="slow"
        motionReduced={false}
        onTextBlip={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '文章をすべて表示' }));
    expect(onAdvance).not.toHaveBeenCalled();
    expect(container.querySelector('.narrative-reveal')).toHaveTextContent(
      'まだ表示中の文章',
    );
    fireEvent.click(screen.getByRole('button', { name: '次の文章へ' }));
    expect(onAdvance).toHaveBeenCalledOnce();
  });

  it('shows full text without blips when motion is reduced', () => {
    const onTextBlip = vi.fn();
    const { container } = render(
      <NarrativePanel
        kind="discovery"
        text="全文を表示する。"
        advanceLabel="メッセージを閉じる"
        onAdvance={vi.fn()}
        textSpeed="normal"
        motionReduced
        onTextBlip={onTextBlip}
      />,
    );

    expect(container.querySelector('.narrative-reveal')).toHaveTextContent(
      '全文を表示する。',
    );
    expect(container.querySelector('.narrative-text')).toHaveAttribute(
      'data-text-complete',
      'true',
    );
    expect(onTextBlip).not.toHaveBeenCalled();
  });

  it('adds readable pauses and ignores punctuation for blips', () => {
    expect(getCharacterDelay('normal', '文')).toBe(44);
    expect(getCharacterDelay('normal', '、')).toBe(132);
    expect(getCharacterDelay('normal', '。')).toBe(220);
    expect(shouldPlayTextBlip('声', 1)).toBe(true);
    expect(shouldPlayTextBlip('声', 2)).toBe(false);
    expect(shouldPlayTextBlip('。', 3)).toBe(false);
  });
});
