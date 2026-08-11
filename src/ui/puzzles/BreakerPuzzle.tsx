import { breakerIds, type BreakerId } from '../../game/domain/ids';

const visualLevels: Record<BreakerId, number> = {
  breaker_1: 2,
  breaker_2: 4,
  breaker_3: 1,
  breaker_4: 3,
};

type Props = {
  sequence: readonly BreakerId[];
  failures: number;
  visualAssist: boolean;
  soundEnabled: boolean;
  onToggleAssist: () => void;
  onToggle: (breakerId: BreakerId) => void;
  onClose: () => void;
};

export function BreakerPuzzle({
  sequence,
  failures,
  visualAssist,
  soundEnabled,
  onToggleAssist,
  onToggle,
  onClose,
}: Props) {
  return (
    <section
      className="puzzle-modal artwork-modal breaker-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="breaker-title"
    >
      <header>
        <p className="eyebrow">EMERGENCY POWER / gfx-close-005</p>
        <h2 id="breaker-title">非常電源ブレーカー</h2>
        <p>周波数の低い回路から4本を接続する。</p>
      </header>
      <div className="breaker-grid" role="group" aria-label="4本のブレーカー">
        {breakerIds.map((breakerId, index) => {
          const isOn = sequence.includes(breakerId);
          const level = visualLevels[breakerId];
          return (
            <button
              type="button"
              key={breakerId}
              className={isOn ? 'breaker is-on' : 'breaker'}
              onClick={() => onToggle(breakerId)}
              aria-pressed={isOn}
              aria-label={`回路 ${index + 1}${visualAssist ? `、音高レベル ${level}` : ''}`}
            >
              <span className="lever" />
              <strong>回路 {index + 1}</strong>
              {visualAssist && (
                <span className={`pitch level-${level}`}>音高 {level} / 4</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="puzzle-feedback" aria-live="assertive">
        {failures > 0 && sequence.length === 0
          ? '接続順が違う。全レバーが戻った。もう一度試せる。'
          : `接続済み ${sequence.length} / 4${soundEnabled ? '' : '（サウンドなし）'}`}
      </p>
      <footer>
        <button
          type="button"
          onClick={onToggleAssist}
          aria-pressed={visualAssist}
        >
          音高の視覚補助：{visualAssist ? 'ON' : 'OFF'}
        </button>
        <button type="button" onClick={onClose}>
          探索へ戻る
        </button>
      </footer>
    </section>
  );
}
