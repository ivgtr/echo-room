import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import type { BreakerId, HotspotId, LocationId } from '../game/domain/ids';
import type {
  ItemId,
  StoryStage,
  TerminalMenuId,
} from '../game/machine/gameMachine';
import type { PacketId } from '../game/puzzles/storyPuzzles';
import { worldViewAssets } from '../world/assets/worldAssets';
import { WorldCanvas } from '../world/renderer/WorldCanvas';
import { IntroDialogue } from './dialogue/IntroDialogue';
import { EndingPanel } from './ending/EndingPanel';
import { HintPanel } from './hints/HintPanel';
import { InventoryPanel } from './inventory/InventoryPanel';
import { AnalysisPanel } from './puzzles/AnalysisPanel';
import { BreakerPuzzle } from './puzzles/BreakerPuzzle';
import { LockerPanel } from './puzzles/LockerPanel';
import { SystemMenu } from './system/SystemMenu';
import { TerminalPanel } from './terminal/TerminalPanel';

const viewOrder: LocationId[] = [
  'location_north_wall',
  'location_east_wall',
  'location_south_wall',
  'location_west_wall',
];

type Props = {
  locationId: LocationId;
  selectedHotspotId: HotspotId | null;
  subtitle: string | null;
  objective: string;
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
  systemMenuOpen: boolean;
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
  onSystemToggle: () => void;
};

export function GameScreen(props: Props) {
  const swipeRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
  } | null>(null);
  const systemReturnFocusRef = useRef<HTMLElement | null>(null);
  const cueTimerRef = useRef<number | null>(null);
  const [locationCue, setLocationCue] = useState<string | null>(null);
  const ending =
    props.storyStage === 'ending' || props.storyStage === 'completed';
  const inspectionModalOpen =
    props.selectedHotspotId === 'hotspot_terminal' ||
    (props.selectedHotspotId === 'hotspot_locker' &&
      props.storyStage === 'unlock_locker') ||
    (props.selectedHotspotId === 'hotspot_analysis_panel' &&
      props.storyStage === 'analyze_voice');
  const overlayOpen =
    props.intro ||
    props.breakerPuzzle ||
    props.inventoryOpen ||
    props.hintOpen ||
    props.systemMenuOpen ||
    inspectionModalOpen ||
    Boolean(props.subtitle) ||
    ending;
  const explorationControlsVisible =
    !props.intro && !props.breakerPuzzle && !ending;

  useEffect(
    () => () => {
      if (cueTimerRef.current !== null)
        window.clearTimeout(cueTimerRef.current);
    },
    [],
  );

  function turn(offset: -1 | 1) {
    const next = getRotatedView(props.locationId, offset);
    props.onViewChanged(next);
    setLocationCue(worldViewAssets[next].label);
    if (cueTimerRef.current !== null) window.clearTimeout(cueTimerRef.current);
    cueTimerRef.current = window.setTimeout(() => setLocationCue(null), 900);
  }

  function toggleSystemMenu() {
    if (!props.systemMenuOpen) {
      systemReturnFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    }
    props.onSystemToggle();
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!ending) {
          event.preventDefault();
          toggleSystemMenu();
        }
        return;
      }
      if (
        overlayOpen ||
        (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
      ) {
        return;
      }
      event.preventDefault();
      turn(event.key === 'ArrowLeft' ? -1 : 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (overlayOpen || isInteractiveTarget(event.target)) return;
    swipeRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLElement>) {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || start.pointerId !== event.pointerId || overlayOpen) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) {
      return;
    }
    turn(deltaX < 0 ? 1 : -1);
  }

  const availableHotspots = worldViewAssets[props.locationId].hotspots.filter(
    ({ id }) =>
      (id !== 'hotspot_breaker' || !props.powerRestored) &&
      (id !== 'hotspot_analysis_panel' || props.storyStage === 'analyze_voice'),
  );

  return (
    <main className="game-shell">
      <div
        className="logical-stage"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          swipeRef.current = null;
        }}
      >
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
            {!ending && (
              <button
                type="button"
                className="system-entry"
                aria-haspopup="dialog"
                aria-expanded={props.systemMenuOpen}
                onClick={toggleSystemMenu}
              >
                SYSTEM
              </button>
            )}
          </div>
        </div>
        {explorationControlsVisible && (
          <div
            className={`exploration-controls${overlayOpen ? ' is-disabled' : ''}`}
            aria-hidden={overlayOpen || undefined}
          >
            <button
              type="button"
              className="edge-turn edge-turn-left"
              aria-label={`左を向く（${worldViewAssets[getRotatedView(props.locationId, -1)].label}）`}
              onClick={() => turn(-1)}
            >
              <span aria-hidden="true">〈</span>
            </button>
            <div className="hotspot-layer" aria-label="調査対象">
              {availableHotspots.map((hotspot) => (
                <button
                  type="button"
                  className="hotspot-control"
                  key={hotspot.id}
                  aria-label={hotspot.label}
                  style={hotspotStyle(hotspot.rect)}
                  onClick={() => props.onHotspotSelected(hotspot.id)}
                >
                  <span>{hotspot.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="edge-turn edge-turn-right"
              aria-label={`右を向く（${worldViewAssets[getRotatedView(props.locationId, 1)].label}）`}
              onClick={() => turn(1)}
            >
              <span aria-hidden="true">〉</span>
            </button>
          </div>
        )}
        {locationCue && !overlayOpen && (
          <div className="location-cue" role="status">
            <span>E-01</span>
            {locationCue}
          </div>
        )}
        {!ending && props.subtitle && (
          <section
            className="subtitle-panel"
            aria-live="polite"
            aria-atomic="true"
          >
            <p>{props.subtitle}</p>
            <button type="button" onClick={props.onClose}>
              閉じる
            </button>
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
        {props.systemMenuOpen && (
          <SystemMenu
            objective={props.objective}
            audioEnabled={props.audioEnabled}
            visualAssist={props.visualAssist}
            inventoryAvailable={props.inventory.length > 0}
            hintAvailable={props.powerRestored}
            hintUnlocked={props.breakerFailures + props.lockerFailures > 0}
            returnFocusRef={systemReturnFocusRef}
            onClose={toggleSystemMenu}
            onToggleAudio={props.onToggleAudio}
            onToggleAssist={props.onToggleAssist}
            onInventory={props.onInventoryToggle}
            onHint={props.onHintToggle}
            onExit={props.onExit}
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

function hotspotStyle(rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}): CSSProperties {
  return {
    left: `${(rect.x / 1920) * 100}%`,
    top: `${(rect.y / 1080) * 100}%`,
    width: `${(rect.width / 1920) * 100}%`,
    height: `${(rect.height / 1080) * 100}%`,
  };
}

function getRotatedView(locationId: LocationId, offset: -1 | 1) {
  const currentIndex = viewOrder.indexOf(locationId);
  return (
    viewOrder[(currentIndex + offset + viewOrder.length) % viewOrder.length] ??
    'location_north_wall'
  );
}

function isInteractiveTarget(target: EventTarget) {
  return (
    target instanceof Element &&
    Boolean(target.closest('button, input, select, textarea, [role="dialog"]'))
  );
}
