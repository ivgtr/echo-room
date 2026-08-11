import { useActorRef, useSelector } from '@xstate/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { playBreakerTone, unlockAudio } from '../audio/tonePlayer';
import type { BreakerId, HotspotId, LocationId } from '../game/domain/ids';
import { gameMachine, type ItemId } from '../game/machine/gameMachine';
import { loadProgress, saveProgress } from '../game/save/saveManager';
import {
  selectBreakerFailures,
  selectBreakerSequence,
  selectActiveElapsedMs,
  selectEndingLineIndex,
  selectFinalOrderReady,
  selectHintLevel,
  selectInspectedMaps,
  selectInventory,
  selectIntroLineIndex,
  selectIsBreakerPuzzle,
  selectIsIntro,
  selectIsPlaying,
  selectLocation,
  selectLockerFailures,
  selectObjective,
  selectPowerRestored,
  selectReservePower,
  selectSelectedHotspot,
  selectSubtitle,
  selectStoryStage,
  selectTerminalMenu,
} from '../game/selectors/gameSelectors';
import { GameScreen } from '../ui/GameScreen';
import {
  discoveryEntry,
  getArchiveDocuments,
  identityEntries,
  introEntries,
  noAdjacentRoomEntries,
  packetEntries,
  powerRestoredEntry,
  type NarrativeEntry,
} from '../ui/narrative/narrativeArchive';
import {
  defaultAudioLevels,
  defaultSubtitleSettings,
  type AudioLevels,
  type SubtitleSettings,
} from '../ui/system/uiSettings';
import { TitleScreen } from '../ui/TitleScreen';
import { UnsupportedScreen } from '../ui/UnsupportedScreen';
import { supportsRequiredEnvironment } from './environment';

const SAVE_MESSAGE_DURATION_MS = 2400;

export function App() {
  const [environmentSupported] = useState(() => supportsRequiredEnvironment());
  const [loadResult] = useState(() => loadProgress());
  const [visualAssist, setVisualAssist] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioLevels, setAudioLevels] =
    useState<AudioLevels>(defaultAudioLevels);
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>(
    defaultSubtitleSettings,
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [narrativeHistory, setNarrativeHistory] = useState<NarrativeEntry[]>(
    [],
  );
  const [acquiredItems, setAcquiredItems] = useState<ItemId[]>([]);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [pageVisible, setPageVisible] = useState(
    () => document.visibilityState === 'visible',
  );
  const actorRef = useActorRef(gameMachine);
  const isPlaying = useSelector(actorRef, selectIsPlaying);
  const intro = useSelector(actorRef, selectIsIntro);
  const breakerPuzzle = useSelector(actorRef, selectIsBreakerPuzzle);
  const locationId = useSelector(actorRef, selectLocation);
  const selectedHotspotId = useSelector(actorRef, selectSelectedHotspot);
  const subtitle = useSelector(actorRef, selectSubtitle);
  const powerRestored = useSelector(actorRef, selectPowerRestored);
  const breakerSequence = useSelector(actorRef, selectBreakerSequence);
  const breakerFailures = useSelector(actorRef, selectBreakerFailures);
  const introLineIndex = useSelector(actorRef, selectIntroLineIndex);
  const terminalMenuId = useSelector(actorRef, selectTerminalMenu);
  const storyStage = useSelector(actorRef, selectStoryStage);
  const inventory = useSelector(actorRef, selectInventory);
  const inspectedMaps = useSelector(actorRef, selectInspectedMaps);
  const lockerFailures = useSelector(actorRef, selectLockerFailures);
  const finalReady = useSelector(actorRef, selectFinalOrderReady);
  const endingLineIndex = useSelector(actorRef, selectEndingLineIndex);
  const hintLevel = useSelector(actorRef, selectHintLevel);
  const objective = useSelector(actorRef, selectObjective);
  const activeElapsedMs = useSelector(actorRef, selectActiveElapsedMs);
  const reservePower = useSelector(actorRef, selectReservePower);
  const savedPowerRef = useRef(false);
  const previousInventoryRef = useRef<ItemId[]>([]);
  const activeElapsedRef = useRef(activeElapsedMs);
  const reservePowerRef = useRef(reservePower);

  const persistPowerCheckpoint = useCallback(
    (
      elapsedMs = activeElapsedRef.current,
      onReservePower = reservePowerRef.current,
    ) => {
      try {
        saveProgress(window.localStorage, elapsedMs, onReservePower);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  useEffect(() => {
    activeElapsedRef.current = activeElapsedMs;
    reservePowerRef.current = reservePower;
  }, [activeElapsedMs, reservePower]);

  useEffect(() => {
    const handleVisibilityChange = () =>
      setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!isPlaying || systemMenuOpen || !pageVisible) return;
    let previousTime = performance.now();
    const commitElapsedTime = () => {
      const currentTime = performance.now();
      const deltaMs = Math.max(0, currentTime - previousTime);
      previousTime = currentTime;
      if (deltaMs > 0) actorRef.send({ type: 'ACTIVE_TIME_ELAPSED', deltaMs });
    };
    const timer = window.setInterval(commitElapsedTime, 250);
    return () => {
      window.clearInterval(timer);
      commitElapsedTime();
    };
  }, [actorRef, isPlaying, pageVisible, systemMenuOpen]);

  const appendHistory = useCallback((entries: readonly NarrativeEntry[]) => {
    setNarrativeHistory((current) => {
      const ids = new Set(current.map(({ id }) => id));
      return [...current, ...entries.filter(({ id }) => !ids.has(id))];
    });
  }, []);

  useEffect(() => {
    if (!powerRestored || savedPowerRef.current) return;
    savedPowerRef.current = true;
    if (persistPowerCheckpoint()) {
      queueMicrotask(() => setSaveMessage('電源復旧地点を自動保存しました'));
    } else {
      queueMicrotask(() =>
        setSaveMessage('保存できませんでした。プレイは続行できます'),
      );
    }
    queueMicrotask(() => appendHistory([powerRestoredEntry]));
  }, [appendHistory, persistPowerCheckpoint, powerRestored]);

  useEffect(() => {
    if (!powerRestored || (!systemMenuOpen && pageVisible)) return;
    persistPowerCheckpoint(activeElapsedMs, reservePower);
  }, [
    activeElapsedMs,
    pageVisible,
    powerRestored,
    reservePower,
    systemMenuOpen,
    persistPowerCheckpoint,
  ]);

  useEffect(() => {
    if (!powerRestored || !reservePower) return;
    persistPowerCheckpoint(activeElapsedRef.current, true);
  }, [persistPowerCheckpoint, powerRestored, reservePower]);

  useEffect(() => {
    const persistActiveTime = () => {
      if (!savedPowerRef.current) return;
      persistPowerCheckpoint();
    };
    window.addEventListener('pagehide', persistActiveTime);
    return () => window.removeEventListener('pagehide', persistActiveTime);
  }, [persistPowerCheckpoint]);

  useEffect(() => {
    if (!subtitle) return;
    queueMicrotask(() => appendHistory([discoveryEntry(subtitle)]));
  }, [appendHistory, subtitle]);

  useEffect(() => {
    const newItems = inventory.filter(
      (item) => !previousInventoryRef.current.includes(item),
    );
    previousInventoryRef.current = inventory;
    if (newItems.length > 0) setAcquiredItems(newItems);
  }, [inventory]);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = window.setTimeout(
      () => setSaveMessage(null),
      SAVE_MESSAGE_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  const handleStart = useCallback(() => {
    savedPowerRef.current = false;
    previousInventoryRef.current = [];
    setSaveMessage(null);
    setNarrativeHistory([]);
    setAcquiredItems([]);
    void unlockAudio().catch(() => setAudioEnabled(false));
    actorRef.send({ type: 'GAME_STARTED' });
  }, [actorRef]);
  const handleHotspot = useCallback(
    (hotspotId: HotspotId) => {
      if (hotspotId === 'hotspot_clock')
        appendHistory([discoveryEntry('アナログ時計は02:17で止まっている。')]);
      if (hotspotId === 'hotspot_desk')
        appendHistory([
          discoveryEntry(
            'EMERGENCY POWER TEST――起動順序：周波数の低い回路から接続すること。',
          ),
        ]);
      actorRef.send({ type: 'HOTSPOT_SELECTED', hotspotId });
    },
    [actorRef, appendHistory],
  );
  const handleView = useCallback(
    (nextLocationId: LocationId) =>
      actorRef.send({ type: 'VIEW_CHANGED', locationId: nextLocationId }),
    [actorRef],
  );
  const handleBreaker = useCallback(
    (breakerId: BreakerId) => {
      playBreakerTone(breakerId, audioEnabled, audioLevels.effects);
      actorRef.send({ type: 'BREAKER_TOGGLED', breakerId });
    },
    [actorRef, audioEnabled, audioLevels.effects],
  );

  const archiveDocuments = getArchiveDocuments(
    powerRestored,
    storyStage,
    inventory,
  );

  if (!environmentSupported) return <UnsupportedScreen />;
  if (!isPlaying)
    return (
      <TitleScreen
        onStart={handleStart}
        {...(loadResult.status === 'valid'
          ? {
              onContinue: () => {
                savedPowerRef.current = true;
                setNarrativeHistory([...introEntries, powerRestoredEntry]);
                actorRef.send({
                  type: 'PROGRESS_RESTORED',
                  activeElapsedMs: loadResult.data.progress.activeElapsedMs,
                  reservePower: loadResult.data.progress.reservePower,
                });
              },
            }
          : {})}
        saveCorrupt={loadResult.status === 'corrupt'}
      />
    );

  return (
    <GameScreen
      locationId={locationId}
      selectedHotspotId={selectedHotspotId}
      subtitle={subtitle}
      objective={objective ?? ''}
      powerRestored={powerRestored}
      intro={intro}
      introLineIndex={introLineIndex}
      breakerPuzzle={breakerPuzzle}
      breakerSequence={breakerSequence}
      breakerFailures={breakerFailures}
      visualAssist={visualAssist}
      audioEnabled={audioEnabled}
      audioLevels={audioLevels}
      subtitleSettings={subtitleSettings}
      saveMessage={saveMessage}
      narrativeHistory={narrativeHistory}
      archiveDocuments={archiveDocuments}
      acquiredItems={acquiredItems}
      terminalMenuId={terminalMenuId}
      storyStage={storyStage}
      inventory={inventory}
      inventoryOpen={inventoryOpen}
      lockerFailures={lockerFailures}
      finalReady={finalReady}
      endingLineIndex={endingLineIndex}
      hintLevel={hintLevel}
      hintOpen={hintOpen}
      systemMenuOpen={systemMenuOpen}
      activeElapsedMs={activeElapsedMs}
      reservePower={reservePower}
      onDialogueAdvance={() => {
        const entry = introEntries[introLineIndex];
        if (entry) appendHistory([entry]);
        actorRef.send({ type: 'DIALOGUE_ADVANCED' });
      }}
      onViewChanged={handleView}
      onHotspotSelected={handleHotspot}
      onBreakerToggle={handleBreaker}
      onClose={() => actorRef.send({ type: 'PUZZLE_CLOSED' })}
      onToggleAssist={() => setVisualAssist((value) => !value)}
      onToggleAudio={() => setAudioEnabled((value) => !value)}
      onAudioLevelChange={(channel, value) =>
        setAudioLevels((current) => ({ ...current, [channel]: value }))
      }
      onSubtitleSettingChange={(key, value) =>
        setSubtitleSettings((current) => ({ ...current, [key]: value }))
      }
      onExit={() => {
        if (powerRestored) persistPowerCheckpoint();
        setSystemMenuOpen(false);
        actorRef.send({ type: 'RETURNED_TO_TITLE' });
      }}
      onTerminalMenu={(menuId) =>
        actorRef.send({ type: 'TERMINAL_MENU_SELECTED', menuId })
      }
      onLogsConfirmed={() => actorRef.send({ type: 'LOGS_CONFIRMED' })}
      onLockerSubmit={(answer) =>
        actorRef.send({ type: 'LOCKER_SUBMITTED', answer })
      }
      onInventoryToggle={() => {
        setSystemMenuOpen(false);
        setInventoryOpen((value) => !value);
      }}
      onMapInspected={(source) => {
        if (!inspectedMaps.includes(source) && inspectedMaps.length === 1)
          appendHistory(noAdjacentRoomEntries);
        actorRef.send({ type: 'FLOOR_MAP_INSPECTED', source });
      }}
      onPacketPlayed={(packetId) => {
        appendHistory([packetEntries[packetId]]);
        actorRef.send({ type: 'PACKET_PLAYED', packetId });
      }}
      onAnalysisComplete={() => {
        appendHistory(identityEntries);
        actorRef.send({ type: 'VOICE_ANALYSIS_STARTED' });
      }}
      onFinalSubmit={(packetIds) =>
        actorRef.send({ type: 'FINAL_ORDER_SUBMITTED', packetIds })
      }
      onTransmit={() => actorRef.send({ type: 'TRANSMISSION_CONFIRMED' })}
      onEndingAdvance={() => actorRef.send({ type: 'ENDING_ADVANCED' })}
      onHintToggle={() => {
        setSystemMenuOpen(false);
        setHintOpen((value) => !value);
      }}
      onHintReveal={() => actorRef.send({ type: 'HINT_REQUESTED' })}
      onSystemToggle={() => {
        setInventoryOpen(false);
        setHintOpen(false);
        setSystemMenuOpen((value) => !value);
      }}
      onDismissAcquisition={() => setAcquiredItems([])}
    />
  );
}
