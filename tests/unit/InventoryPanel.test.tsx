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
      name: /ACCESS CARD 職員用カード/,
    });
    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/SECURITY認証/)).toBeVisible();
    expect(
      screen.getByLabelText('施設E-01 職員用アクセスカード'),
    ).toHaveTextContent('PERSONNEL DATA / ENCRYPTED');
    expect(
      screen.getByRole('img', {
        name: 'E-01職員証に登録された男性職員の写真',
      }),
    ).toHaveAttribute(
      'src',
      '/assets/images/items/gfx-item-003__approved__badge-crop__512x640.webp',
    );

    fireEvent.click(
      screen.getByRole('button', { name: /CONDUIT MAP 設備・配線図/ }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'フロア図を展開する' }));
    expect(onInspectMap).toHaveBeenCalledOnce();
    expect(screen.getByText(/通信線は壁内中継器/)).toBeVisible();
    expect(screen.getByText('ECHO BUFFER RETURN ○')).toBeVisible();
    expect(screen.getByText('CONTROL ROOM')).toBeVisible();
    expect(screen.getByText('MACHINE ROOM')).toBeVisible();
  });
});
