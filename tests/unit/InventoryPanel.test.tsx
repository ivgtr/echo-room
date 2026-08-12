import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { InventoryPanel } from '../../src/ui/inventory/InventoryPanel';

describe('InventoryPanel', () => {
  it('selects semantic item controls and opens the floor map', () => {
    const onInspectMap = vi.fn();
    render(
      <InventoryPanel
        items={['item_screwdriver', 'item_staff_card', 'item_floor_map']}
        onInspectMap={onInspectMap}
        onClose={vi.fn()}
      />,
    );

    const card = screen.getByRole('button', {
      name: /ACCESS CARD 職員証/,
    });
    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/SECURITYを開けられる/)).toBeVisible();
    expect(screen.getByLabelText('施設E-01の職員証')).toHaveTextContent(
      'PERSONNEL DATA / ENCRYPTED',
    );
    expect(
      screen.getByRole('img', {
        name: 'E-01職員証に登録された男性職員の写真',
      }),
    ).toHaveAttribute(
      'src',
      '/assets/images/items/gfx-item-003__approved__badge-crop__512x640.webp',
    );

    fireEvent.click(screen.getByRole('button', { name: /CONDUIT MAP 施設図/ }));
    fireEvent.click(screen.getByRole('button', { name: '図を広げる' }));
    expect(onInspectMap).toHaveBeenCalledOnce();
    expect(screen.getByText(/通信線は機械設備区画へ/)).toBeVisible();
    expect(screen.getByText('ECHO BUFFER RETURN ○')).toBeVisible();
    expect(screen.getByText('CONTROL ROOM')).toBeVisible();
    expect(screen.getByText('MACHINE ROOM')).toBeVisible();
  });
});
