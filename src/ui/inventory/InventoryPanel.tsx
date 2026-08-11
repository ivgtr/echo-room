import type { ItemId } from '../../game/machine/gameMachine';

const labels: Record<ItemId, string> = {
  item_screwdriver: 'ドライバー',
  item_staff_card: '職員用カード',
  item_floor_map: '簡易フロア図',
};

export function InventoryPanel({
  items,
  onInspectMap,
  onClose,
}: {
  items: ItemId[];
  onInspectMap: () => void;
  onClose: () => void;
}) {
  return (
    <section
      className="puzzle-modal compact-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inventory-title"
    >
      <h2 id="inventory-title">所持品</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>
            {labels[item]}{' '}
            {item === 'item_floor_map' && (
              <button type="button" onClick={onInspectMap}>
                展開して確認
              </button>
            )}
          </li>
        ))}
      </ul>
      <p>E-01の左右は機械設備とコンクリート壁。隣室は存在しない。</p>
      <button type="button" onClick={onClose}>
        閉じる
      </button>
    </section>
  );
}
