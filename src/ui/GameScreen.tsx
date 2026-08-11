import type { BreakerId, HotspotId, LocationId } from '../game/domain/ids';
import type { TerminalMenuId } from '../game/machine/gameMachine';
import { WorldCanvas } from '../world/renderer/WorldCanvas';
import { IntroDialogue } from './dialogue/IntroDialogue';
import { BreakerPuzzle } from './puzzles/BreakerPuzzle';
import { TerminalPanel } from './terminal/TerminalPanel';

const views: { id: LocationId; label: string; short: string }[] = [
  { id: 'location_north_wall', label: '北壁を見る', short: '北' },
  { id: 'location_east_wall', label: '東壁を見る', short: '東' },
  { id: 'location_south_wall', label: '南壁を見る', short: '南' },
  { id: 'location_west_wall', label: '西壁を見る', short: '西' },
];

type Props = {
  locationId: LocationId;
  selectedHotspotId: HotspotId | null;
  subtitle: string | null;
  powerRestored: boolean;
  intro: boolean;
  introLineIndex: number;
  breakerPuzzle: boolean;
  breakerSequence: readonly BreakerId[];
  breakerFailures: number;
  visualAssist: boolean;
  audioEnabled: boolean;
  saveMessage: string | null;
  terminalMenuId: TerminalMenuId;
  onDialogueAdvance: () => void;
  onViewChanged: (locationId: LocationId) => void;
  onHotspotSelected: (hotspotId: HotspotId) => void;
  onBreakerToggle: (breakerId: BreakerId) => void;
  onBreakerClose: () => void;
  onToggleAssist: () => void;
  onToggleAudio: () => void;
  onExit: () => void;
  onTerminalMenu: (menuId: TerminalMenuId) => void;
};

export function GameScreen(props: Props) {
  return (
    <main className="game-shell">
      <div className="logical-stage">
        <WorldCanvas
          locationId={props.locationId}
          powerRestored={props.powerRestored}
          selectedHotspotId={props.selectedHotspotId}
          onHotspotSelected={props.onHotspotSelected}
        />
        <div className="hud-layer">
          <div className="status-cluster" aria-label="現在の状況">
            <span>
              {props.powerRestored ? 'MAIN POWER ONLINE' : 'EMERGENCY LOCK'}
            </span>
            <strong>BATTERY 00:19:48</strong>
          </div>
          <div className="hud-actions">
            <button
              type="button"
              className="system-button"
              onClick={props.onToggleAudio}
              aria-pressed={props.audioEnabled}
            >
              音声 {props.audioEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              className="system-button"
              onClick={props.onExit}
            >
              タイトルへ
            </button>
          </div>
        </div>
        {!props.intro && !props.breakerPuzzle && (
          <nav className="view-navigation" aria-label="見る方向">
            {views.map((view) => (
              <button
                type="button"
                key={view.id}
                aria-label={view.label}
                aria-current={props.locationId === view.id ? 'true' : undefined}
                onClick={() => props.onViewChanged(view.id)}
              >
                {view.short}
              </button>
            ))}
          </nav>
        )}
        <div className="world-actions" aria-label="調査対象">
          {props.locationId === 'location_north_wall' && (
            <button
              type="button"
              onClick={() => props.onHotspotSelected('hotspot_door')}
            >
              鉄製ドアを調べる
            </button>
          )}
          {props.locationId === 'location_east_wall' && (
            <button
              type="button"
              onClick={() => props.onHotspotSelected('hotspot_terminal')}
            >
              壁面端末を調べる
            </button>
          )}
          {props.locationId === 'location_south_wall' && (
            <button
              type="button"
              onClick={() => props.onHotspotSelected('hotspot_desk')}
            >
              デスクを調べる
            </button>
          )}
          {props.locationId === 'location_west_wall' && (
            <button
              type="button"
              onClick={() => props.onHotspotSelected('hotspot_breaker')}
            >
              ブレーカーを調べる
            </button>
          )}
        </div>
        <section
          className="subtitle-panel"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="speaker">主人公</span>
          <p>{props.subtitle}</p>
        </section>
        {props.intro && (
          <IntroDialogue
            lineIndex={props.introLineIndex}
            onAdvance={props.onDialogueAdvance}
          />
        )}
        {props.breakerPuzzle && (
          <BreakerPuzzle
            sequence={props.breakerSequence}
            failures={props.breakerFailures}
            visualAssist={props.visualAssist}
            audioEnabled={props.audioEnabled}
            onToggleAssist={props.onToggleAssist}
            onToggle={props.onBreakerToggle}
            onClose={props.onBreakerClose}
          />
        )}
        {props.powerRestored &&
          props.selectedHotspotId === 'hotspot_terminal' && (
            <TerminalPanel
              menuId={props.terminalMenuId}
              onSelect={props.onTerminalMenu}
              onClose={props.onBreakerClose}
            />
          )}
        {props.saveMessage && (
          <div className="toast" role="status">
            {props.saveMessage}
          </div>
        )}
        <div className="screen-noise" aria-hidden="true" />
      </div>
    </main>
  );
}
