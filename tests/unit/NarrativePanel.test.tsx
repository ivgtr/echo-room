import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NarrativePanel } from '../../src/ui/narrative/NarrativePanel';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('NarrativePanel', () => {
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
});
