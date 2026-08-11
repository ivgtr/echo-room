import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TitleScreen } from '../../src/ui/TitleScreen';

describe('TitleScreen', () => {
  it('starts from an explicit user gesture', () => {
    const onStart = vi.fn();
    render(<TitleScreen onStart={onStart} saveCorrupt={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'ゲーム開始' }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
