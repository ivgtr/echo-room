import type { BreakerId, HotspotId, LocationId } from '../game/domain/ids';
import type {
  ItemId,
  StoryStage,
  TerminalMenuId,
} from '../game/machine/gameMachine';
import type { PacketId } from '../game/puzzles/storyPuzzles';
import { WorldCanvas } from '../world/renderer/WorldCanvas';
import { IntroDialogue } from './dialogue/IntroDialogue';
import { EndingPanel } from './ending/EndingPanel';
import { HintPanel } from './hints/HintPanel';
import { InventoryPanel } from './inventory/InventoryPanel';
import { AnalysisPanel } from './puzzles/AnalysisPanel';
import { BreakerPuzzle } from './puzzles/BreakerPuzzle';
import { LockerPanel } from './puzzles/LockerPanel';
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
  storyStage: StoryStage;
  inventory: ItemId[];
  inventoryOpen: boolean;
  lockerFailures: number;
  finalReady: boolean;
  endingLineIndex: number;
  hintLevel: number;
  hintOpen: boolean;
  onDialogueAdvance: () => void;
  onViewChanged: (id: LocationId) => void;
  onHotspotSelected: (id: HotspotId) => void;
  onBreakerToggle: (id: BreakerId) => void;
  onClose: () => void;
  onToggleAssist: () => void;
  onToggleAudio: () => void;
  onExit: () => void;
  onTerminalMenu: (id: TerminalMenuId) => void;
  onLogsConfirmed: () => void;
  onLockerSubmit: (answer: string) => void;
  onInventoryToggle: () => void;
  onMapInspected: (source: 'inventory' | 'security') => void;
  onPacketPlayed: (id: PacketId) => void;
  onAnalysisComplete: () => void;
  onFinalSubmit: (ids: string[]) => void;
  onTransmit: () => void;
  onEndingAdvance: () => void;
  onHintToggle: () => void;
  onHintReveal: () => void;
};

export function GameScreen(props: Props) {
  const ending =
    props.storyStage === 'ending' || props.storyStage === 'completed';
  return (
    <main className="game-shell">
      <div className="logical-stage">
        <WorldCanvas
          locationId={props.locationId}
          powerRestored={props.powerRestored}
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
            {props.inventory.length > 0 && (
              <button
                type="button"
                className="system-button"
                onClick={props.onInventoryToggle}
              >
                所持品
              </button>
            )}
            {props.powerRestored && !ending && (
              <button
                type="button"
                className="system-button"
                onClick={props.onHintToggle}
              >
                {props.breakerFailures + props.lockerFailures > 0
                  ? 'ヒント（利用可能）'
                  : 'ヒント'}
              </button>
            )}
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
        {!props.intro && !props.breakerPuzzle && !ending && (
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
        {!ending && (
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
              <>
                <button
                  type="button"
                  onClick={() => props.onHotspotSelected('hotspot_terminal')}
                >
                  壁面端末を調べる
                </button>
                {props.storyStage === 'analyze_voice' && (
                  <button
                    type="button"
                    onClick={() =>
                      props.onHotspotSelected('hotspot_analysis_panel')
                    }
                  >
                    解析パネルを調べる
                  </button>
                )}
              </>
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
              <>
                {!props.powerRestored && (
                  <button
                    type="button"
                    onClick={() => props.onHotspotSelected('hotspot_breaker')}
                  >
                    ブレーカーを調べる
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => props.onHotspotSelected('hotspot_locker')}
                >
                  ロッカーを調べる
                </button>
              </>
            )}
          </div>
        )}
        {!ending && (
          <section
            className="subtitle-panel"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="speaker">主人公</span>
            <p>{props.subtitle}</p>
          </section>
        )}
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
            onClose={props.onClose}
          />
        )}
        {props.powerRestored &&
          props.selectedHotspotId === 'hotspot_terminal' &&
          !ending && (
            <TerminalPanel
              menuId={props.terminalMenuId}
              stage={props.storyStage}
              finalReady={props.finalReady}
              onSelect={props.onTerminalMenu}
              onClose={props.onClose}
              onLogsConfirmed={props.onLogsConfirmed}
              onMapInspected={() => props.onMapInspected('security')}
              onPacketPlayed={props.onPacketPlayed}
              onFinalSubmit={props.onFinalSubmit}
              onTransmit={props.onTransmit}
            />
          )}
        {props.selectedHotspotId === 'hotspot_locker' &&
          props.storyStage === 'unlock_locker' && (
            <LockerPanel
              failures={props.lockerFailures}
              onSubmit={props.onLockerSubmit}
              onClose={props.onClose}
            />
          )}
        {props.selectedHotspotId === 'hotspot_analysis_panel' &&
          props.storyStage === 'analyze_voice' && (
            <AnalysisPanel
              onComplete={props.onAnalysisComplete}
              onClose={props.onClose}
            />
          )}
        {props.inventoryOpen && (
          <InventoryPanel
            items={props.inventory}
            onInspectMap={() => props.onMapInspected('inventory')}
            onClose={props.onInventoryToggle}
          />
        )}
        {props.hintOpen && (
          <HintPanel
            stage={props.storyStage}
            level={props.hintLevel}
            onReveal={props.onHintReveal}
            onClose={props.onHintToggle}
          />
        )}
        {ending && (
          <EndingPanel
            lineIndex={props.endingLineIndex}
            completed={props.storyStage === 'completed'}
            onAdvance={props.onEndingAdvance}
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
