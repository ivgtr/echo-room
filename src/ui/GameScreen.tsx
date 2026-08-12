import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { type HotspotId, type LocationId } from '../game/domain/ids';
import type {
  ItemId,
  StoryStage,
  TerminalMenuId,
} from '../game/machine/gameMachine';
import {
  isPuzzleAnswerCorrect,
  type PuzzleId,
} from '../game/puzzles/storyPuzzles';
import {
  getHotspotBounds,
  worldViewAssets,
  type WorldHotspot,
} from '../world/assets/worldAssets';
import { WorldCanvas } from '../world/renderer/WorldCanvas';
import { ModalFocusScope } from './accessibility/ModalFocusScope';
import { IntroDialogue } from './dialogue/IntroDialogue';
import { EndingPanel } from './ending/EndingPanel';
import { InspectionEvidencePanel } from './evidence/InspectionEvidencePanel';
import { InspectionTrace } from './exploration/InspectionTrace';
import { HintPanel } from './hints/HintPanel';
import { ItemAcquisitionNotice } from './inventory/ItemAcquisitionNotice';
import { InventoryPanel } from './inventory/InventoryPanel';
import { NarrativePanel } from './narrative/NarrativePanel';
import type {
  ArchiveDocument,
  NarrativeEntry,
} from './narrative/narrativeArchive';
import { PuzzleDevice } from './puzzles/PuzzleDevice';
import { SystemMenu } from './system/SystemMenu';
import type {
  SoundLevels,
  SubtitleSettingChange,
  SubtitleSettings,
} from './system/uiSettings';
import { TerminalPanel } from './terminal/TerminalPanel';
import { EmergencyPowerStatus } from './status/EmergencyPowerStatus';
import { getEmergencyPowerPhase } from '../game/time/emergencyPower';

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
  introSeen: boolean;
  powerPuzzle: boolean;
  visualAssist: boolean;
  motionReduced: boolean;
  soundEnabled: boolean;
  soundLevels: SoundLevels;
  subtitleSettings: SubtitleSettings;
  saveMessage: string | null;
  eventNarrative: NarrativeEntry | null;
  narrativeHistory: readonly NarrativeEntry[];
  archiveDocuments: readonly ArchiveDocument[];
  acquiredItems: readonly ItemId[];
  terminalMenuId: TerminalMenuId;
  storyStage: StoryStage;
  inventory: ItemId[];
  completedPuzzleIds: PuzzleId[];
  puzzleFailures: Record<PuzzleId, number>;
  inventoryOpen: boolean;
  endingLineIndex: number;
  hintLevel: number;
  hintOpen: boolean;
  systemMenuOpen: boolean;
  activeElapsedMs: number;
  reservePower: boolean;
  onDialogueAdvance: () => void;
  onDialogueSkip: () => void;
  onViewChanged: (id: LocationId) => void;
  onHotspotSelected: (id: HotspotId) => void;
  onPuzzleSubmit: (puzzleId: PuzzleId, answer: string[]) => void;
  onClose: () => void;
  onToggleAssist: () => void;
  onToggleMotion: () => void;
  onToggleSound: () => void;
  onSoundLevelChange: (channel: keyof SoundLevels, value: number) => void;
  onSubtitleSettingChange: SubtitleSettingChange;
  onExit: () => void;
  onTerminalMenu: (id: TerminalMenuId) => void;
  onInventoryToggle: () => void;
  onTransmit: () => void;
  onEndingAdvance: () => void;
  onHintToggle: () => void;
  onHintReveal: () => void;
  onSystemToggle: () => void;
  onDismissAcquisition: () => void;
  onUiClick: () => void;
  onPuzzleInteraction: (puzzleId: PuzzleId) => void;
  onTextBlip: () => void;
  onEventNarrativeAdvance: () => void;
};

export function GameScreen(props: Props) {
  const { onClose, onPuzzleSubmit, onTransmit } = props;
  const powerPhase = props.reservePower
    ? 'reserve'
    : getEmergencyPowerPhase(props.activeElapsedMs);
  const swipeRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
  } | null>(null);
  const systemReturnFocusRef = useRef<HTMLElement | null>(null);
  const inspectionReturnFocusRef = useRef<HTMLElement | null>(null);
  const systemButtonRef = useRef<HTMLButtonElement>(null);
  const introWasOpenRef = useRef(props.intro);
  const cueTimerRef = useRef<number | null>(null);
  const inspectionTimerRef = useRef<number | null>(null);
  const inspectionLockedRef = useRef(false);
  const [locationCue, setLocationCue] = useState<string | null>(null);
  const [inspectionTargetId, setInspectionTargetId] =
    useState<HotspotId | null>(null);
  const [inspectionPhase, setInspectionPhase] = useState<
    'idle' | 'approaching' | 'active'
  >('idle');
  const acquisitionVisible =
    props.acquiredItems.length > 0 && !props.eventNarrative;
  const endingSequence =
    props.storyStage === 'ending_transmission' ||
    props.storyStage === 'ending_replay';
  const ending = endingSequence || props.storyStage === 'completed';
  const doorEscape = props.storyStage === 'ending_door';
  const inspectionModalOpen =
    props.selectedHotspotId === 'hotspot_clock' ||
    props.selectedHotspotId === 'hotspot_desk' ||
    (props.powerRestored && props.selectedHotspotId === 'hotspot_terminal') ||
    (props.selectedHotspotId === 'hotspot_locker' &&
      props.storyStage === 'puzzle_maintenance_lock') ||
    (props.selectedHotspotId === 'hotspot_analysis_panel' &&
      props.storyStage === 'puzzle_voiceprint_calibration');
  const overlayOpen =
    props.intro ||
    props.powerPuzzle ||
    acquisitionVisible ||
    props.inventoryOpen ||
    props.hintOpen ||
    props.systemMenuOpen ||
    inspectionPhase !== 'idle' ||
    inspectionModalOpen ||
    Boolean(props.subtitle) ||
    Boolean(props.eventNarrative) ||
    ending;
  const explorationControlsVisible =
    !props.intro && !props.powerPuzzle && !ending;
  const availableHotspots = worldViewAssets[props.locationId].hotspots.filter(
    ({ id }) =>
      (!doorEscape || id === 'hotspot_door') &&
      (id !== 'hotspot_breaker' ||
        !props.powerRestored ||
        props.storyStage === 'puzzle_maintenance_lock') &&
      (id !== 'hotspot_analysis_panel' ||
        props.storyStage === 'puzzle_voiceprint_calibration'),
  );
  const displayedInspectionTargetId =
    props.selectedHotspotId ?? inspectionTargetId;
  const inspectionTarget = displayedInspectionTargetId
    ? (findHotspot(displayedInspectionTargetId) ?? null)
    : null;

  useEffect(
    () => () => {
      if (cueTimerRef.current !== null)
        window.clearTimeout(cueTimerRef.current);
      if (inspectionTimerRef.current !== null)
        window.clearTimeout(inspectionTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (introWasOpenRef.current && !props.intro)
      systemButtonRef.current?.focus();
    introWasOpenRef.current = props.intro;
  }, [props.intro]);

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

  function requestHotspot(hotspotId: HotspotId) {
    const hotspot = availableHotspots.find(({ id }) => id === hotspotId);
    if (!hotspot || overlayOpen || inspectionLockedRef.current) return;
    inspectionLockedRef.current = true;
    inspectionReturnFocusRef.current = document.querySelector<HTMLElement>(
      `[data-hotspot-id="${hotspotId}"]`,
    );
    setInspectionTargetId(hotspotId);
    setInspectionPhase('approaching');
    inspectionTimerRef.current = window.setTimeout(() => {
      setInspectionPhase('active');
      props.onHotspotSelected(hotspotId);
    }, 380);
  }

  const finishInspection = useCallback(() => {
    inspectionLockedRef.current = false;
    setInspectionPhase('idle');
    setInspectionTargetId(null);
  }, []);

  const closeInspection = useCallback(() => {
    onClose();
    finishInspection();
  }, [finishInspection, onClose]);

  const handlePuzzleSubmit = useCallback(
    (puzzleId: PuzzleId, answer: string[]) => {
      onPuzzleSubmit(puzzleId, answer);
      if (
        isPuzzleAnswerCorrect(puzzleId, answer) &&
        puzzleId !== 'puzzle_transmission_window'
      )
        finishInspection();
    },
    [finishInspection, onPuzzleSubmit],
  );

  const handleTransmit = useCallback(() => {
    onTransmit();
    finishInspection();
  }, [finishInspection, onTransmit]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (acquisitionVisible) {
          event.preventDefault();
          props.onDismissAcquisition();
          return;
        }
        if (props.eventNarrative) {
          event.preventDefault();
          return;
        }
        if (props.subtitle) {
          event.preventDefault();
          closeInspection();
          return;
        }
        if (props.powerPuzzle || inspectionModalOpen) {
          event.preventDefault();
          closeInspection();
          return;
        }
        if (!ending) {
          event.preventDefault();
          toggleSystemMenu();
        }
        return;
      }
      if (
        overlayOpen ||
        (event.target instanceof Element &&
          event.target.closest('[data-puzzle-id]') !== null) ||
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

  const inspectionDialog = props.powerPuzzle ? (
    <PuzzleDevice
      puzzleId="puzzle_power_route"
      failures={props.puzzleFailures.puzzle_power_route}
      onSubmit={handlePuzzleSubmit}
      onClose={closeInspection}
    />
  ) : props.selectedHotspotId === 'hotspot_clock' ? (
    <InspectionEvidencePanel kind="clock" onClose={closeInspection} />
  ) : props.selectedHotspotId === 'hotspot_desk' ? (
    <InspectionEvidencePanel kind="desk" onClose={closeInspection} />
  ) : props.powerRestored &&
    props.selectedHotspotId === 'hotspot_terminal' &&
    !ending ? (
    <TerminalPanel
      menuId={props.terminalMenuId}
      stage={props.storyStage}
      completedPuzzleIds={props.completedPuzzleIds}
      puzzleFailures={props.puzzleFailures}
      onSelect={props.onTerminalMenu}
      onClose={closeInspection}
      onPuzzleSubmit={handlePuzzleSubmit}
      onTransmit={handleTransmit}
    />
  ) : props.selectedHotspotId === 'hotspot_locker' &&
    props.storyStage === 'puzzle_maintenance_lock' ? (
    <PuzzleDevice
      puzzleId="puzzle_maintenance_lock"
      failures={props.puzzleFailures.puzzle_maintenance_lock}
      onSubmit={handlePuzzleSubmit}
      onClose={closeInspection}
    />
  ) : props.selectedHotspotId === 'hotspot_analysis_panel' &&
    props.storyStage === 'puzzle_voiceprint_calibration' ? (
    <PuzzleDevice
      puzzleId="puzzle_voiceprint_calibration"
      failures={props.puzzleFailures.puzzle_voiceprint_calibration}
      onSubmit={handlePuzzleSubmit}
      onClose={closeInspection}
    />
  ) : null;

  return (
    <main className="game-shell">
      <div
        className={`logical-stage${overlayOpen ? ' world-input-locked' : ''}${inspectionPhase !== 'idle' ? ` is-inspection-${inspectionPhase}` : ''}`}
        data-inspection-phase={inspectionPhase}
        data-inspection-motion={
          props.motionReduced ? 'crossfade' : 'zoom-or-crossfade'
        }
        data-subtitle-size={props.subtitleSettings.size}
        data-subtitle-background={props.subtitleSettings.background}
        data-text-speed={props.subtitleSettings.speed}
        data-power-phase={powerPhase}
        style={inspectionStageStyle(inspectionTarget)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          swipeRef.current = null;
        }}
        onClickCapture={(event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const button = target.closest('button:not(:disabled)');
          if (!button) return;
          const device = button.closest<HTMLElement>('[data-puzzle-id]');
          const puzzleId = device?.dataset.puzzleId as PuzzleId | undefined;
          if (puzzleId) props.onPuzzleInteraction(puzzleId);
          else props.onUiClick();
        }}
      >
        <WorldCanvas
          locationId={props.locationId}
          powerRestored={props.powerRestored}
          motionReduced={props.motionReduced}
          onHotspotSelected={requestHotspot}
        />
        <div className="hud-layer">
          <div className="status-cluster" role="group" aria-label="現在の状況">
            <EmergencyPowerStatus
              activeElapsedMs={props.activeElapsedMs}
              powerRestored={props.powerRestored}
              reservePower={props.reservePower}
            />
          </div>
          <div className="hud-actions">
            {!ending && !doorEscape && (
              <button
                type="button"
                className="system-entry"
                ref={systemButtonRef}
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
            inert={overlayOpen || undefined}
          >
            <button
              type="button"
              className="edge-turn edge-turn-left"
              aria-label={`左を向く（${worldViewAssets[getRotatedView(props.locationId, -1)].label}）`}
              onClick={() => turn(-1)}
            >
              <span aria-hidden="true">〈</span>
            </button>
            <div className="hotspot-layer" role="group" aria-label="調査対象">
              {availableHotspots.map((hotspot) => (
                <div
                  className="hotspot-target"
                  key={hotspot.id}
                  style={hotspotBoundsStyle(hotspot)}
                >
                  <button
                    type="button"
                    className="hotspot-control"
                    aria-label={hotspot.label}
                    data-hotspot-id={hotspot.id}
                    style={hotspotClipStyle(hotspot)}
                    onClick={() => requestHotspot(hotspot.id)}
                  />
                  <span className="hotspot-label" aria-hidden="true">
                    {hotspot.label}
                  </span>
                </div>
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
        {inspectionPhase === 'approaching' && inspectionTarget && (
          <div
            className="inspection-transition-target"
            style={hotspotBoundsStyle(inspectionTarget)}
            role="status"
            aria-label={inspectionTarget.label}
          >
            <InspectionTrace
              hotspot={inspectionTarget}
              motionReduced={props.motionReduced}
            />
            <span className="inspection-transition-label" aria-hidden="true">
              {inspectionTarget.label}
            </span>
          </div>
        )}
        {locationCue && !overlayOpen && (
          <div className="location-cue" role="status">
            <span>E-01</span>
            {locationCue}
          </div>
        )}
        {doorEscape && (
          <div className="door-escape-cue" role="status" aria-live="assertive">
            ドア解錠 / 北壁のドアから脱出する
          </div>
        )}
        {!ending && props.subtitle && (
          <ModalFocusScope
            focusKey={`message-${props.subtitle}`}
            returnFocusRef={inspectionReturnFocusRef}
            fallbackFocusRef={systemButtonRef}
          >
            <NarrativePanel
              kind="discovery"
              text={props.subtitle}
              advanceLabel="メッセージを閉じる"
              onAdvance={closeInspection}
              textSpeed={props.subtitleSettings.speed}
              motionReduced={props.motionReduced}
              onTextBlip={props.onTextBlip}
            />
          </ModalFocusScope>
        )}
        {props.intro && (
          <IntroDialogue
            lineIndex={props.introLineIndex}
            canSkip={props.introSeen}
            onAdvance={props.onDialogueAdvance}
            onSkip={props.onDialogueSkip}
            textSpeed={props.subtitleSettings.speed}
            motionReduced={props.motionReduced}
            onTextBlip={props.onTextBlip}
          />
        )}
        {props.eventNarrative && (
          <ModalFocusScope
            focusKey={`event-${props.eventNarrative.id}`}
            returnFocusRef={inspectionReturnFocusRef}
            fallbackFocusRef={systemButtonRef}
          >
            <NarrativePanel
              kind={props.eventNarrative.kind}
              {...(props.eventNarrative.speaker
                ? { speaker: props.eventNarrative.speaker }
                : {})}
              text={props.eventNarrative.text}
              advanceLabel="次の文章へ"
              onAdvance={props.onEventNarrativeAdvance}
              autoFocus
              textSpeed={props.subtitleSettings.speed}
              motionReduced={props.motionReduced}
              onTextBlip={props.onTextBlip}
            />
          </ModalFocusScope>
        )}
        {inspectionDialog && (
          <ModalFocusScope
            focusKey={
              props.powerPuzzle
                ? 'hotspot_breaker'
                : (props.selectedHotspotId ?? 'inspection')
            }
            returnFocusRef={inspectionReturnFocusRef}
            fallbackFocusRef={systemButtonRef}
          >
            {inspectionDialog}
          </ModalFocusScope>
        )}
        {acquisitionVisible && (
          <ModalFocusScope
            focusKey="item-acquisition"
            returnFocusRef={inspectionReturnFocusRef}
            fallbackFocusRef={systemButtonRef}
          >
            <ItemAcquisitionNotice
              items={props.acquiredItems}
              onDismiss={props.onDismissAcquisition}
            />
          </ModalFocusScope>
        )}
        {props.inventoryOpen && (
          <ModalFocusScope
            focusKey="inventory"
            returnFocusRef={systemReturnFocusRef}
            fallbackFocusRef={systemButtonRef}
          >
            <InventoryPanel
              items={props.inventory}
              onInspectMap={() => undefined}
              onClose={props.onInventoryToggle}
            />
          </ModalFocusScope>
        )}
        {props.hintOpen && (
          <ModalFocusScope
            focusKey="hint"
            returnFocusRef={systemReturnFocusRef}
            fallbackFocusRef={systemButtonRef}
          >
            <HintPanel
              stage={props.storyStage}
              level={props.hintLevel}
              onReveal={props.onHintReveal}
              onClose={props.onHintToggle}
            />
          </ModalFocusScope>
        )}
        {props.systemMenuOpen && (
          <SystemMenu
            objective={props.objective}
            activeElapsedMs={props.activeElapsedMs}
            powerRestored={props.powerRestored}
            reservePower={props.reservePower}
            soundEnabled={props.soundEnabled}
            soundLevels={props.soundLevels}
            subtitleSettings={props.subtitleSettings}
            visualAssist={props.visualAssist}
            motionReduced={props.motionReduced}
            inventoryAvailable={props.inventory.length > 0}
            hintAvailable={props.powerRestored}
            hintUnlocked={Object.values(props.puzzleFailures).some(
              (failures) => failures > 0,
            )}
            narrativeHistory={props.narrativeHistory}
            documents={props.archiveDocuments}
            returnFocusRef={systemReturnFocusRef}
            onClose={toggleSystemMenu}
            onToggleSound={props.onToggleSound}
            onSoundLevelChange={props.onSoundLevelChange}
            onSubtitleSettingChange={props.onSubtitleSettingChange}
            onToggleAssist={props.onToggleAssist}
            onToggleMotion={props.onToggleMotion}
            onInventory={props.onInventoryToggle}
            onHint={props.onHintToggle}
            onExit={props.onExit}
          />
        )}
        {(endingSequence || props.storyStage === 'completed') && (
          <EndingPanel
            lineIndex={props.endingLineIndex}
            completed={props.storyStage === 'completed'}
            onAdvance={props.onEndingAdvance}
            textSpeed={props.subtitleSettings.speed}
            motionReduced={props.motionReduced}
            onTextBlip={props.onTextBlip}
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

function hotspotBoundsStyle(hotspot: WorldHotspot): CSSProperties {
  const bounds = getHotspotBounds(hotspot);
  return {
    left: `${(bounds.x / 1920) * 100}%`,
    top: `${(bounds.y / 1080) * 100}%`,
    width: `${(bounds.width / 1920) * 100}%`,
    height: `${(bounds.height / 1080) * 100}%`,
  };
}

function hotspotClipStyle(hotspot: WorldHotspot): CSSProperties {
  const bounds = getHotspotBounds(hotspot);
  const clipPath = hotspot.polygon
    .map(
      ([x, y]) =>
        `${((x - bounds.x) / bounds.width) * 100}% ${((y - bounds.y) / bounds.height) * 100}%`,
    )
    .join(', ');
  return { clipPath: `polygon(${clipPath})` };
}

function inspectionStageStyle(hotspot: WorldHotspot | null) {
  if (!hotspot) return undefined;
  const bounds = getHotspotBounds(hotspot);
  return {
    '--inspection-x': `${((bounds.x + bounds.width / 2) / 1920) * 100}%`,
    '--inspection-y': `${((bounds.y + bounds.height / 2) / 1080) * 100}%`,
  } as CSSProperties;
}

function findHotspot(hotspotId: HotspotId) {
  return Object.values(worldViewAssets)
    .flatMap(({ hotspots }) => hotspots)
    .find(({ id }) => id === hotspotId);
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
