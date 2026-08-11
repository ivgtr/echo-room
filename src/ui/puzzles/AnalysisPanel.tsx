import { useState } from 'react';

import type { ItemId } from '../../game/machine/gameMachine';

export function AnalysisPanel({
  items,
  onComplete,
  onClose,
}: {
  items: readonly ItemId[];
  onComplete: () => void;
  onClose: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const [rate, setRate] = useState(0);
  const analyze = () => {
    setRate(98);
    requestAnimationFrame(() => {
      setRate(99);
      requestAnimationFrame(() => setRate(100));
    });
  };
  return (
    <section
      className={`puzzle-modal compact-modal artwork-modal analysis-modal ${opened ? 'is-open' : 'is-closed'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="analysis-title"
    >
      <p className="eyebrow">VOICE ANALYSIS / gfx-close-009</p>
      <h2 id="analysis-title">端末横解析パネル</h2>
      {!opened ? (
        <div className="context-item-use">
          <p>パネルに使用する所持品を選ぶ。</p>
          <button
            type="button"
            className="inventory-card item-use-card"
            disabled={!items.includes('item_screwdriver')}
            onClick={() => setOpened(true)}
          >
            <span>DRIVER</span> ドライバーを選択
          </button>
        </div>
      ) : rate < 100 ? (
        <button type="button" onClick={analyze}>
          VOICE ANALYSISをONにする
        </button>
      ) : (
        <div className="analysis-result">
          <strong>VOICEPRINT MATCH 100%</strong>
          <p>REGISTERED USER: E-01 OCCUPANT</p>
          <div className="portrait-placeholder">
            protagonist_unknown
            <br />
            512×640 PLACEHOLDER
          </div>
          <button type="button" onClick={onComplete}>
            結果を確認する
          </button>
        </div>
      )}
      {rate > 0 && rate < 100 && (
        <p role="status">SPEAKER ANALYSIS... {rate}%</p>
      )}
      <button type="button" onClick={onClose}>
        戻る
      </button>
    </section>
  );
}
