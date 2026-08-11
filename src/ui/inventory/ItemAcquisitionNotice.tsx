import type { ItemId } from '../../game/machine/gameMachine';

import { itemDetails } from './itemDetails';

export function ItemAcquisitionNotice({
  items,
  onDismiss,
}: {
  items: readonly ItemId[];
  onDismiss: () => void;
}) {
  return (
    <section
      className="item-acquisition"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-acquisition-title"
    >
      <p className="eyebrow">ITEM ACQUIRED</p>
      <h2 id="item-acquisition-title">所持品を入手した</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{itemDetails[item].label}</li>
        ))}
      </ul>
      <button type="button" onClick={onDismiss}>
        所持品に追加
      </button>
    </section>
  );
}
