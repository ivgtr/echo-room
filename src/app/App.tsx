import { useActorRef, useSelector } from '@xstate/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { playBreakerTone, unlockAudio } from '../audio/tonePlayer';
import type { BreakerId, HotspotId, LocationId } from '../game/domain/ids';
import { gameMachine } from '../game/machine/gameMachine';
import { loadProgress, saveProgress } from '../game/save/saveManager';
import {
  selectBreakerFailures,
  selectBreakerSequence,
  selectEndingLineIndex,
  selectFinalOrderReady,
  selectHintLevel,
  selectInventory,
  selectIntroLineIndex,
  selectIsBreakerPuzzle,
  selectIsIntro,
  selectIsPlaying,
  selectLocation,
  selectLockerFailures,
  selectObjective,
  selectPowerRestored,
  selectSelectedHotspot,
  selectSubtitle,
  selectStoryStage,
  selectTerminalMenu,
} from '../game/selectors/gameSelectors';
import { GameScreen } from '../ui/GameScreen';
import { TitleScreen } from '../ui/TitleScreen';
import { UnsupportedScreen } from '../ui/UnsupportedScreen';
import { supportsRequiredEnvironment } from './environment';

export function App() {
  const [environmentSupported] = useState(() => supportsRequiredEnvironment());
  const [loadResult] = useState(() => loadProgress());
  const [visualAssist, setVisualAssist] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
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
  const lockerFailures = useSelector(actorRef, selectLockerFailures);
  const finalReady = useSelector(actorRef, selectFinalOrderReady);
  const endingLineIndex = useSelector(actorRef, selectEndingLineIndex);
  const hintLevel = useSelector(actorRef, selectHintLevel);
  const objective = useSelector(actorRef, selectObjective);
  const savedPowerRef = useRef(false);

  useEffect(() => {
    if (!powerRestored || savedPowerRef.current) return;
    savedPowerRef.current = true;
    try {
      saveProgress();
      queueMicrotask(() => setSaveMessage('電源復旧地点を自動保存しました'));
    } catch {
      queueMicrotask(() =>
        setSaveMessage('保存できませんでした。プレイは続行できます'),
      );
    }
  }, [powerRestored]);

  const handleStart = useCallback(() => {
    void unlockAudio().catch(() => setAudioEnabled(false));
    actorRef.send({ type: 'GAME_STARTED' });
  }, [actorRef]);
  const handleHotspot = useCallback(
    (hotspotId: HotspotId) =>
      actorRef.send({ type: 'HOTSPOT_SELECTED', hotspotId }),
    [actorRef],
  );
  const handleView = useCallback(
    (nextLocationId: LocationId) =>
      actorRef.send({ type: 'VIEW_CHANGED', locationId: nextLocationId }),
    [actorRef],
  );
  const handleBreaker = useCallback(
    (breakerId: BreakerId) => {
      playBreakerTone(breakerId, audioEnabled);
      actorRef.send({ type: 'BREAKER_TOGGLED', breakerId });
    },
    [actorRef, audioEnabled],
  );

  if (!environmentSupported) return <UnsupportedScreen />;
  if (!isPlaying)
    return (
      <TitleScreen
        onStart={handleStart}
        {...(loadResult.status === 'valid'
          ? { onContinue: () => actorRef.send({ type: 'PROGRESS_RESTORED' }) }
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
      saveMessage={saveMessage}
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
      onDialogueAdvance={() => actorRef.send({ type: 'DIALOGUE_ADVANCED' })}
      onViewChanged={handleView}
      onHotspotSelected={handleHotspot}
      onBreakerToggle={handleBreaker}
      onClose={() => actorRef.send({ type: 'PUZZLE_CLOSED' })}
      onToggleAssist={() => setVisualAssist((value) => !value)}
      onToggleAudio={() => setAudioEnabled((value) => !value)}
      onExit={() => {
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
      onMapInspected={(source) =>
        actorRef.send({ type: 'FLOOR_MAP_INSPECTED', source })
      }
      onPacketPlayed={(packetId) =>
        actorRef.send({ type: 'PACKET_PLAYED', packetId })
      }
      onAnalysisComplete={() =>
        actorRef.send({ type: 'VOICE_ANALYSIS_STARTED' })
      }
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
    />
  );
}
