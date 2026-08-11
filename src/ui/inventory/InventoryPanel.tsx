import { useState } from 'react';

import type { ItemId } from '../../game/machine/gameMachine';
import { itemDetails } from './itemDetails';

export function InventoryPanel({
  items,
  onInspectMap,
  onClose,
}: {
  items: ItemId[];
  onInspectMap: () => void;
  onClose: () => void;
}) {
  const [selectedItem, setSelectedItem] = useState<ItemId>(
    items[0] ?? 'item_screwdriver',
  );
  const detail = itemDetails[selectedItem];
  return (
    <section
      className="puzzle-modal compact-modal inventory-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inventory-title"
    >
      <header>
        <p className="eyebrow">ITEM TRAY</p>
        <h2 id="inventory-title">所持品</h2>
      </header>
      <div className="inventory-layout">
        <ul className="inventory-tray" aria-label="所持品一覧">
          {items.map((item) => (
            <li key={item}>
              <button
                type="button"
                className="inventory-card"
                aria-pressed={selectedItem === item}
                onClick={() => setSelectedItem(item)}
              >
                <span>{itemDetails[item].code}</span> {itemDetails[item].label}
              </button>
            </li>
          ))}
        </ul>
        <section className="inventory-detail" aria-live="polite">
          <p className="eyebrow">{detail.code}</p>
          <h3>{detail.label}</h3>
          <p>{detail.description}</p>
          {selectedItem === 'item_floor_map' && (
            <button type="button" onClick={onInspectMap}>
              フロア図を展開する
            </button>
          )}
        </section>
      </div>
      <button type="button" onClick={onClose}>
        所持品を閉じる
      </button>
    </section>
  );
}
