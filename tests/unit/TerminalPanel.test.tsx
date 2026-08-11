import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TerminalPanel } from '../../src/ui/terminal/TerminalPanel';

describe('TerminalPanel', () => {
  it('shows exact story times and keeps future menus locked', () => {
    const onSelect = vi.fn();
    render(
      <TerminalPanel menuId="system" onSelect={onSelect} onClose={vi.fn()} />,
    );
    expect(screen.getByText('-00:20:00')).toBeVisible();
    expect(screen.getByRole('button', { name: /AUDIO/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'LOG' }));
    expect(onSelect).toHaveBeenCalledWith('log');
  });
});
