import type { HotspotId } from '../game/domain/ids';
import { WorldCanvas } from '../world/renderer/WorldCanvas';

type Props = {
  selectedHotspotId: HotspotId | null;
  subtitle: string | null;
  onHotspotSelected: (hotspotId: HotspotId) => void;
  onExit: () => void;
};

export function GameScreen({
  selectedHotspotId,
  subtitle,
  onHotspotSelected,
  onExit,
}: Props) {
  return (
    <main className="game-shell">
      <div className="logical-stage">
        <WorldCanvas
          selectedHotspotId={selectedHotspotId}
          onHotspotSelected={onHotspotSelected}
        />
        <div className="hud-layer">
          <div className="status-cluster" aria-label="現在の状況">
            <span>EMERGENCY LOCK</span>
            <strong>BATTERY 00:19:48</strong>
          </div>
          <button type="button" className="system-button" onClick={onExit}>
            タイトルへ
          </button>
        </div>
        <div className="modal-layer" />
        <section
          className="subtitle-panel"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="speaker">主人公</span>
          <p>{subtitle}</p>
        </section>
        <div className="screen-noise" aria-hidden="true" />
      </div>
    </main>
  );
}
