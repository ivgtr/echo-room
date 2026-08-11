import { useActorRef, useSelector } from '@xstate/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { playBreakerTone, unlockAudio } from '../audio/tonePlayer';
import type { BreakerId, HotspotId, LocationId } from '../game/domain/ids';
import { gameMachine } from '../game/machine/gameMachine';
import { loadProgress, saveProgress } from '../game/save/saveManager';
import {
  selectBreakerFailures,
  selectBreakerSequence,
  selectIntroLineIndex,
  selectIsBreakerPuzzle,
  selectIsIntro,
  selectIsPlaying,
  selectLocation,
  selectPowerRestored,
  selectSelectedHotspot,
  selectSubtitle,
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
      powerRestored={powerRestored}
      intro={intro}
      introLineIndex={introLineIndex}
      breakerPuzzle={breakerPuzzle}
      breakerSequence={breakerSequence}
      breakerFailures={breakerFailures}
      visualAssist={visualAssist}
      audioEnabled={audioEnabled}
      saveMessage={saveMessage}
      onDialogueAdvance={() => actorRef.send({ type: 'DIALOGUE_ADVANCED' })}
      onViewChanged={handleView}
      onHotspotSelected={handleHotspot}
      onBreakerToggle={handleBreaker}
      onBreakerClose={() => actorRef.send({ type: 'PUZZLE_CLOSED' })}
      onToggleAssist={() => setVisualAssist((value) => !value)}
      onToggleAudio={() => setAudioEnabled((value) => !value)}
      onExit={() => actorRef.send({ type: 'RETURNED_TO_TITLE' })}
    />
  );
}
