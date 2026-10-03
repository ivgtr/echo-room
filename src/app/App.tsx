import { useActorRef, useSelector } from '@xstate/react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  AudioUnlockRequest,
  hasAudioChoice,
  rememberAudioChoice,
} from '../audio/audioSetup';
import { voiceCues } from '../audio/voiceManifest';
import {
  soundManager,
  type EffectScope,
  type SoundEffectId,
} from '../audio/soundManager';
import { type HotspotId, type LocationId } from '../game/domain/ids';
import { gameMachine, type ItemId } from '../game/machine/gameMachine';
import {
  isPuzzleAnswerCorrect,
  type PuzzleId,
} from '../game/puzzles/storyPuzzles';
import {
  clearProgress,
  getCheckpointId,
  loadProgress,
  loadSettings,
  saveProgress,
  saveSettings,
  type SavedProgress,
} from '../game/save/saveManager';
import {
  selectActiveElapsedMs,
  selectCompletedPuzzleIds,
  selectEndingLineIndex,
  selectHintLevel,
  selectInventory,
  selectIntroLineIndex,
  selectIsPowerPuzzle,
  selectIsIntro,
  selectIsPlaying,
  selectLocation,
  selectObjective,
  selectPowerRestored,
  selectPuzzleFailures,
  selectReservePower,
  selectSelectedHotspot,
  selectSubtitle,
  selectStoryStage,
  selectTerminalMenu,
} from '../game/selectors/gameSelectors';
import { getEmergencyPowerPhase } from '../game/time/emergencyPower';
import { GameScreen } from '../ui/GameScreen';
import {
  discoveryEntry,
  getArchiveDocuments,
  getRestoredNarrativeHistory,
  introEntries,
  endingEntries,
  packetEntries,
  getPuzzleCompletionEntries,
  powerRestoredEntry,
  type NarrativeEntry,
} from '../ui/narrative/narrativeArchive';
import type { SoundLevels, SubtitleSettings } from '../ui/system/uiSettings';
import { TitleScreen } from '../ui/TitleScreen';
import { UnsupportedScreen } from '../ui/UnsupportedScreen';
import { supportsRequiredEnvironment } from './environment';

const SAVE_MESSAGE_DURATION_MS = 2400;

export function App() {
  const [environmentSupported] = useState(() => supportsRequiredEnvironment());
  const [loadResult, setLoadResult] = useState(() => loadProgress());
  const [initialSettings] = useState(() => loadSettings());
  const [audioChoiceMade, setAudioChoiceMade] = useState(() =>
    hasAudioChoice(),
  );
  const [gameAudioRequest] = useState(() => new AudioUnlockRequest());
  const [visualAssist, setVisualAssist] = useState(
    initialSettings.visualAssist,
  );
  const [motionReduced, setMotionReduced] = useState(
    initialSettings.motionReduced ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [introSeen, setIntroSeen] = useState(initialSettings.introSeen);
  const [soundEnabled, setSoundEnabled] = useState(
    audioChoiceMade && initialSettings.soundEnabled,
  );
  const [soundLevels, setSoundLevels] = useState<SoundLevels>(
    initialSettings.soundLevels,
  );
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>(
    initialSettings.subtitleSettings,
  );
  const voicePlayback = useSyncExternalStore(
    soundManager.subscribeVoice,
    soundManager.getVoicePlayback,
  );
  const [archiveAudioRequest] = useState(() => new AudioUnlockRequest());
  const handleStopVoice = useCallback(() => {
    archiveAudioRequest.cancel();
    soundManager.stopVoice();
  }, [archiveAudioRequest]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [narrativeHistory, setNarrativeHistory] = useState<NarrativeEntry[]>(
    [],
  );
  const [eventNarrativeQueue, setEventNarrativeQueue] = useState<
    NarrativeEntry[]
  >([]);
  const [packetEntryId, setPacketEntryId] = useState<string | null>(null);
  const encounteredSceneEntriesRef = useRef(new Set<string>());
  const handlePacketEntryChange = useCallback(
    (entryId: string | null) => {
      if (entryId === null) handleStopVoice();
      setPacketEntryId(entryId);
    },
    [handleStopVoice],
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
  const powerPuzzle = useSelector(actorRef, selectIsPowerPuzzle);
  const locationId = useSelector(actorRef, selectLocation);
  const selectedHotspotId = useSelector(actorRef, selectSelectedHotspot);
  const subtitle = useSelector(actorRef, selectSubtitle);
  const powerRestored = useSelector(actorRef, selectPowerRestored);
  const introLineIndex = useSelector(actorRef, selectIntroLineIndex);
  const terminalMenuId = useSelector(actorRef, selectTerminalMenu);
  const storyStage = useSelector(actorRef, selectStoryStage);
  const inventory = useSelector(actorRef, selectInventory);
  const completedPuzzleIds = useSelector(actorRef, selectCompletedPuzzleIds);
  const puzzleFailures = useSelector(actorRef, selectPuzzleFailures);
  const endingLineIndex = useSelector(actorRef, selectEndingLineIndex);
  const hintLevel = useSelector(actorRef, selectHintLevel);
  const objective = useSelector(actorRef, selectObjective);
  const activeElapsedMs = useSelector(actorRef, selectActiveElapsedMs);
  const reservePower = useSelector(actorRef, selectReservePower);
  const savedProgressRef = useRef(false);
  const progressWritableRef = useRef(loadResult.status !== 'corrupt');
  const latestProgressRef = useRef<SavedProgress | null>(null);
  const lastSavedFingerprintRef = useRef<string | null>(null);
  const lastSavedCheckpointRef = useRef<SavedProgress['checkpointId'] | null>(
    null,
  );
  const previousInventoryRef = useRef<ItemId[]>([]);
  const activeElapsedRef = useRef(activeElapsedMs);
  const reservePowerRef = useRef(reservePower);

  latestProgressRef.current = {
    checkpointId: getCheckpointId(storyStage, completedPuzzleIds),
    powerRestored: true,
    locationId,
    storyStage,
    inventory: [...inventory],
    completedPuzzleIds: [...completedPuzzleIds],
    puzzleFailures: { ...puzzleFailures },
    endingLineIndex: storyStage === 'completed' ? endingEntries.length : 0,
    hintLevel,
    activeElapsedMs,
    reservePower,
  };

  const persistCurrentProgress = useCallback(
    (
      elapsedMs = activeElapsedRef.current,
      onReservePower = reservePowerRef.current,
    ) => {
      if (!progressWritableRef.current || !latestProgressRef.current)
        return false;
      try {
        const progress = {
          ...latestProgressRef.current,
          activeElapsedMs: elapsedMs,
          reservePower: onReservePower,
        };
        saveProgress(progress, window.localStorage);
        lastSavedFingerprintRef.current = progressFingerprint(progress);
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
    try {
      saveSettings(
        {
          schemaVersion: 4,
          soundEnabled,
          visualAssist,
          motionReduced,
          introSeen,
          soundLevels,
          subtitleSettings,
        },
        window.localStorage,
      );
      // Never mark onboarding complete before its matching preference is saved.
      if (audioChoiceMade) rememberAudioChoice(window.localStorage);
    } catch {
      // Settings storage failure must not interrupt play.
    }
  }, [
    audioChoiceMade,
    soundEnabled,
    soundLevels,
    introSeen,
    motionReduced,
    subtitleSettings,
    visualAssist,
  ]);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(motionReduced);
    return () => {
      delete document.documentElement.dataset.reducedMotion;
    };
  }, [motionReduced]);

  useEffect(() => {
    if (!isPlaying || !pageVisible || !soundEnabled || soundLevels.voice === 0)
      handleStopVoice();
    soundManager.sync({
      active: isPlaying && pageVisible,
      paused: systemMenuOpen,
      enabled: soundEnabled,
      effectsVolume: soundLevels.effects,
      voiceVolume: soundLevels.voice,
      environmentVolume: soundLevels.environment,
      powered: powerRestored,
      powerPhase: reservePower
        ? 'reserve'
        : getEmergencyPowerPhase(activeElapsedMs),
    });
  }, [
    isPlaying,
    pageVisible,
    powerRestored,
    activeElapsedMs,
    reservePower,
    soundEnabled,
    soundLevels.effects,
    soundLevels.voice,
    soundLevels.environment,
    systemMenuOpen,
    handleStopVoice,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      if (!visible) handleStopVoice();
      setPageVisible(visible);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleStopVoice]);

  useEffect(() => {
    if (!isPlaying || systemMenuOpen || !pageVisible) return;
    let previousTime = performance.now();
    let clockVisible = document.visibilityState === 'visible';
    const commitElapsedTime = () => {
      const currentTime = performance.now();
      const deltaMs = Math.max(0, currentTime - previousTime);
      previousTime = currentTime;
      if (clockVisible && deltaMs > 0)
        actorRef.send({ type: 'ACTIVE_TIME_ELAPSED', deltaMs });
    };
    // Flush at the visibility event itself, before React's deferred cleanup.
    // Hidden time must not be charged when timers or effects resume later.
    const syncClockVisibility = () => {
      commitElapsedTime();
      clockVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', syncClockVisibility);
    const timer = window.setInterval(commitElapsedTime, 250);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', syncClockVisibility);
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
    const progress = latestProgressRef.current;
    if (!powerRestored || !progress) return;
    const fingerprint = progressFingerprint(progress);
    if (lastSavedFingerprintRef.current === fingerprint) return;

    const firstSave = !savedProgressRef.current;
    const previousCheckpoint = lastSavedCheckpointRef.current;
    savedProgressRef.current = true;
    if (persistCurrentProgress()) {
      lastSavedCheckpointRef.current = progress.checkpointId;
      if (firstSave || previousCheckpoint !== progress.checkpointId)
        queueMicrotask(() => setSaveMessage('自動保存しました'));
    } else {
      queueMicrotask(() =>
        setSaveMessage('保存できませんでした。プレイは続行できます'),
      );
    }
    if (firstSave) queueMicrotask(() => appendHistory([powerRestoredEntry]));
  }, [
    appendHistory,
    completedPuzzleIds,
    hintLevel,
    inventory,
    puzzleFailures,
    persistCurrentProgress,
    powerRestored,
    reservePower,
    storyStage,
  ]);

  useEffect(() => {
    if (!powerRestored || (!systemMenuOpen && pageVisible)) return;
    persistCurrentProgress(activeElapsedMs, reservePower);
  }, [
    activeElapsedMs,
    pageVisible,
    powerRestored,
    reservePower,
    systemMenuOpen,
    persistCurrentProgress,
  ]);

  useEffect(() => {
    if (!powerRestored || !reservePower) return;
    persistCurrentProgress(activeElapsedRef.current, true);
  }, [persistCurrentProgress, powerRestored, reservePower]);

  useEffect(() => {
    const persistActiveTime = () => {
      if (!savedProgressRef.current) return;
      persistCurrentProgress();
    };
    window.addEventListener('pagehide', persistActiveTime);
    return () => window.removeEventListener('pagehide', persistActiveTime);
  }, [persistCurrentProgress]);

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

  useEffect(() => () => gameAudioRequest.cancel(), [gameAudioRequest]);
  const unlockGameSound = useCallback(() => {
    gameAudioRequest.run(
      () => soundManager.unlock(),
      (result) => {
        if (result !== 'ready') {
          setSoundEnabled(false);
          setSaveMessage('音を開始できませんでした。SYSTEMから再設定できます');
        }
      },
    );
  }, [gameAudioRequest]);

  const activeEventNarrative = eventNarrativeQueue[0] ?? null;
  const packetSceneVisible =
    selectedHotspotId === 'hotspot_terminal' &&
    terminalMenuId === 'audio' &&
    storyStage === 'puzzle_packet_repair';
  const currentEntry = !isPlaying
    ? null
    : intro
      ? introEntries[introLineIndex]
      : (activeEventNarrative ??
        (storyStage === 'ending_transmission' || storyStage === 'ending_replay'
          ? endingEntries[endingLineIndex]
          : packetSceneVisible
            ? packetEntries.find(({ id }) => id === packetEntryId)
            : null));
  useEffect(() => {
    if (!currentEntry) return;
    // Queueing a scene is not reading it. Register just the displayed line.
    appendHistory([currentEntry]);
    if (encounteredSceneEntriesRef.current.has(currentEntry.id)) return;
    encounteredSceneEntriesRef.current.add(currentEntry.id);
    if (voiceCues[currentEntry.id])
      return soundManager.playVoice(currentEntry.id);
  }, [appendHistory, currentEntry]);
  useEffect(() => handleStopVoice, [handleStopVoice]);
  const handleReplayVoice = useCallback(
    (entryId: string) => {
      // The manifest is not authority to expose a line: only read history is.
      const terminalPacketReplay =
        selectedHotspotId === 'hotspot_terminal' &&
        completedPuzzleIds.includes('puzzle_packet_repair') &&
        (terminalMenuId === 'audio' ||
          (terminalMenuId === 'system' &&
            storyStage === 'transmission_ready')) &&
        packetEntries.some(({ id }) => id === entryId);
      if (
        (!systemMenuOpen && !terminalPacketReplay) ||
        !pageVisible ||
        !soundEnabled ||
        soundLevels.voice === 0 ||
        !narrativeHistory.some((entry) => entry.id === entryId) ||
        !voiceCues[entryId]
      )
        return;
      const current = soundManager.getVoicePlayback();
      handleStopVoice();
      if (
        current.entryId === entryId &&
        (current.status === 'playing' || current.status === 'loading')
      )
        return;
      archiveAudioRequest.run(
        () => soundManager.unlock(),
        (result) => {
          if (result === 'ready')
            soundManager.playVoice(
              entryId,
              systemMenuOpen ? 'archive' : 'scene',
            );
          else setSaveMessage('音声を開始できませんでした。字幕で続けられます');
        },
      );
    },
    [
      systemMenuOpen,
      selectedHotspotId,
      completedPuzzleIds,
      terminalMenuId,
      storyStage,
      pageVisible,
      soundEnabled,
      soundLevels.voice,
      narrativeHistory,
      handleStopVoice,
      archiveAudioRequest,
    ],
  );
  const handleStart = useCallback(() => {
    savedProgressRef.current = false;
    lastSavedFingerprintRef.current = null;
    lastSavedCheckpointRef.current = null;
    previousInventoryRef.current = [];
    setSaveMessage(null);
    setNarrativeHistory([]);
    setEventNarrativeQueue([]);
    setPacketEntryId(null);
    encounteredSceneEntriesRef.current.clear();
    setAcquiredItems([]);
    setAudioChoiceMade(true);
    if (soundEnabled) unlockGameSound();
    actorRef.send({ type: 'GAME_STARTED' });
  }, [actorRef, soundEnabled, unlockGameSound]);
  const handleUiClick = useCallback(
    (scope?: EffectScope) => soundManager.playEffect('ui_click', scope),
    [],
  );
  const handleTextBlip = useCallback(
    () => soundManager.playEffect('text_blip'),
    [],
  );
  const handleEventNarrativeAdvance = useCallback(() => {
    handleStopVoice();
    setEventNarrativeQueue((current) => current.slice(1));
  }, [handleStopVoice]);
  const handleHotspot = useCallback(
    (hotspotId: HotspotId) => {
      if (storyStage === 'ending_door' && hotspotId === 'hotspot_door') {
        actorRef.send({ type: 'ENDING_DOOR_SELECTED' });
        return;
      }
      if (hotspotId === 'hotspot_clock')
        appendHistory([discoveryEntry('時計は02:17で止まっている。')]);
      if (hotspotId === 'hotspot_desk')
        appendHistory([discoveryEntry(deskDiscoveryText())]);
      actorRef.send({ type: 'HOTSPOT_SELECTED', hotspotId });
    },
    [actorRef, appendHistory, storyStage],
  );
  const handleView = useCallback(
    (nextLocationId: LocationId) =>
      actorRef.send({ type: 'VIEW_CHANGED', locationId: nextLocationId }),
    [actorRef],
  );
  const handlePuzzleSubmit = useCallback(
    (puzzleId: PuzzleId, answer: string[]) => {
      const snapshot = actorRef.getSnapshot();
      if (
        puzzleId === 'puzzle_power_route'
          ? !selectIsPowerPuzzle(snapshot)
          : !snapshot.matches({ playing: 'powered' }) ||
            snapshot.context.storyStage !== puzzleId
      )
        return;
      const correct = isPuzzleAnswerCorrect(puzzleId, answer);
      soundManager.playEffect(
        correct ? puzzleSuccessCue[puzzleId] : puzzleFailureCue[puzzleId],
      );
      if (correct) {
        handleStopVoice();
        const entries = [...getPuzzleCompletionEntries(puzzleId)];
        setEventNarrativeQueue(entries);
      }
      actorRef.send({ type: 'PUZZLE_SUBMITTED', puzzleId, answer });
    },
    [actorRef, handleStopVoice],
  );

  const archiveDocuments = getArchiveDocuments(powerRestored, inventory);

  if (!environmentSupported) return <UnsupportedScreen />;
  if (!isPlaying)
    return (
      <TitleScreen
        onStart={handleStart}
        soundEnabled={soundEnabled}
        audioChoiceMade={audioChoiceMade}
        onSoundChoice={(enabled) => {
          gameAudioRequest.cancel();
          setSoundEnabled(enabled);
          setAudioChoiceMade(true);
        }}
        onSoundUnlock={() => soundManager.unlock()}
        motionReduced={motionReduced}
        onToggleMotion={() => setMotionReduced((value) => !value)}
        {...(loadResult.status === 'valid'
          ? {
              onContinue: () => {
                setAudioChoiceMade(true);
                if (soundEnabled) unlockGameSound();
                const progress = loadResult.data.progress;
                savedProgressRef.current = true;
                progressWritableRef.current = true;
                lastSavedFingerprintRef.current = progressFingerprint(progress);
                lastSavedCheckpointRef.current = progress.checkpointId;
                previousInventoryRef.current = [...progress.inventory];
                setAcquiredItems([]);
                setEventNarrativeQueue([]);
                setPacketEntryId(null);
                const history = getRestoredNarrativeHistory(progress);
                setNarrativeHistory(history);
                encounteredSceneEntriesRef.current = new Set(
                  history.map(({ id }) => id),
                );
                actorRef.send({
                  type: 'PROGRESS_RESTORED',
                  progress,
                });
              },
            }
          : {})}
        saveStatus={loadResult.status}
        onDeleteSave={() => {
          try {
            clearProgress(window.localStorage);
            progressWritableRef.current = true;
            savedProgressRef.current = false;
            lastSavedFingerprintRef.current = null;
            lastSavedCheckpointRef.current = null;
            setLoadResult({ status: 'empty' });
            return true;
          } catch {
            return false;
          }
        }}
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
      introSeen={introSeen}
      powerPuzzle={powerPuzzle}
      visualAssist={visualAssist}
      motionReduced={motionReduced}
      soundEnabled={soundEnabled}
      voicePlayback={voicePlayback}
      onReplayVoice={handleReplayVoice}
      onStopVoice={handleStopVoice}
      onPacketEntryChange={handlePacketEntryChange}
      soundLevels={soundLevels}
      subtitleSettings={subtitleSettings}
      saveMessage={saveMessage}
      eventNarrative={activeEventNarrative}
      narrativeHistory={narrativeHistory}
      archiveDocuments={archiveDocuments}
      acquiredItems={acquiredItems}
      terminalMenuId={terminalMenuId}
      storyStage={storyStage}
      inventory={inventory}
      completedPuzzleIds={completedPuzzleIds}
      puzzleFailures={puzzleFailures}
      inventoryOpen={inventoryOpen}
      endingLineIndex={endingLineIndex}
      hintLevel={hintLevel}
      hintOpen={hintOpen}
      systemMenuOpen={systemMenuOpen}
      activeElapsedMs={activeElapsedMs}
      reservePower={reservePower}
      onDialogueAdvance={() => {
        handleStopVoice();
        if (introLineIndex >= introEntries.length - 1) setIntroSeen(true);
        actorRef.send({ type: 'DIALOGUE_ADVANCED' });
      }}
      onDialogueSkip={() => {
        handleStopVoice();
        setIntroSeen(true);
        actorRef.send({ type: 'DIALOGUE_SKIPPED' });
      }}
      onViewChanged={handleView}
      onHotspotSelected={handleHotspot}
      onPuzzleSubmit={handlePuzzleSubmit}
      onClose={() => {
        handleStopVoice();
        actorRef.send({ type: 'PUZZLE_CLOSED' });
      }}
      onToggleAssist={() => setVisualAssist((value) => !value)}
      onToggleMotion={() => setMotionReduced((value) => !value)}
      onToggleSound={() => {
        // Silent starts do not create an AudioContext; enabling needs a gesture.
        gameAudioRequest.cancel();
        if (!soundEnabled) unlockGameSound();
        setSoundEnabled((value) => !value);
      }}
      onSoundLevelChange={(channel, value) =>
        setSoundLevels((current) => ({ ...current, [channel]: value }))
      }
      onSubtitleSettingChange={(key, value) =>
        setSubtitleSettings((current) => ({ ...current, [key]: value }))
      }
      onExit={() => {
        handleStopVoice();
        gameAudioRequest.cancel();
        if (powerRestored) persistCurrentProgress();
        setSystemMenuOpen(false);
        setLoadResult(loadProgress());
        actorRef.send({ type: 'RETURNED_TO_TITLE' });
      }}
      onTerminalMenu={(menuId) => {
        handleStopVoice();
        soundManager.playEffect('terminal_connect');
        actorRef.send({ type: 'TERMINAL_MENU_SELECTED', menuId });
      }}
      onInventoryOpen={() => {
        setSystemMenuOpen(false);
        setInventoryOpen(true);
      }}
      onInventoryClose={() => {
        setInventoryOpen(false);
        setSystemMenuOpen(true);
      }}
      onTransmit={() => {
        handleStopVoice();
        soundManager.playEffect('transmission');
        actorRef.send({ type: 'TRANSMISSION_CONFIRMED' });
      }}
      onEndingAdvance={() => {
        handleStopVoice();
        if (endingLineIndex === 0)
          soundManager.playEffect('communication_noise');
        if (endingLineIndex >= endingEntries.length - 1)
          soundManager.playEffect('door_unlock');
        actorRef.send({ type: 'ENDING_ADVANCED' });
      }}
      onHintOpen={() => {
        setSystemMenuOpen(false);
        setHintOpen(true);
      }}
      onHintClose={() => {
        setHintOpen(false);
        setSystemMenuOpen(true);
      }}
      onHintReveal={() => actorRef.send({ type: 'HINT_REQUESTED' })}
      onSystemToggle={() => {
        handleStopVoice();
        setInventoryOpen(false);
        setHintOpen(false);
        setSystemMenuOpen((value) => !value);
      }}
      onDismissAcquisition={() => setAcquiredItems([])}
      onUiClick={handleUiClick}
      onPuzzleInteraction={(puzzleId) =>
        soundManager.playEffect(puzzleInteractionCue[puzzleId])
      }
      onTextBlip={handleTextBlip}
      onEventNarrativeAdvance={handleEventNarrativeAdvance}
    />
  );
}

const puzzleInteractionCue: Record<PuzzleId, SoundEffectId> = {
  puzzle_power_route: 'power_relay',
  puzzle_carrier_sync: 'carrier_lock',
  puzzle_maintenance_lock: 'locker_dial',
  puzzle_signal_investigation: 'log_patch',
  puzzle_packet_repair: 'packet_snap',
  puzzle_voiceprint_calibration: 'voice_scan',
  puzzle_transmission_window: 'transmit_charge',
};

const puzzleSuccessCue: Record<PuzzleId, SoundEffectId> = {
  puzzle_power_route: 'power_restore',
  puzzle_carrier_sync: 'carrier_lock',
  puzzle_maintenance_lock: 'locker_unlock',
  puzzle_signal_investigation: 'terminal_connect',
  puzzle_packet_repair: 'analysis_complete',
  puzzle_voiceprint_calibration: 'analysis_complete',
  puzzle_transmission_window: 'transmit_charge',
};

const puzzleFailureCue: Record<PuzzleId, SoundEffectId> = {
  puzzle_power_route: 'locker_error',
  puzzle_carrier_sync: 'locker_error',
  puzzle_maintenance_lock: 'locker_error',
  puzzle_signal_investigation: 'communication_noise',
  puzzle_packet_repair: 'communication_noise',
  puzzle_voiceprint_calibration: 'locker_error',
  puzzle_transmission_window: 'locker_error',
};

function deskDiscoveryText() {
  return '仕事のメモや私物が、片づけられないまま散らばっている。';
}

function progressFingerprint(progress: SavedProgress) {
  return JSON.stringify({ ...progress, activeElapsedMs: 0 });
}
