import { useActorRef, useSelector } from '@xstate/react';
import { useState } from 'react';

import { gameMachine } from '../game/machine/gameMachine';
import {
  selectIsPlaying,
  selectSelectedHotspot,
  selectSubtitle,
} from '../game/selectors/gameSelectors';
import { GameScreen } from '../ui/GameScreen';
import { TitleScreen } from '../ui/TitleScreen';
import { UnsupportedScreen } from '../ui/UnsupportedScreen';
import { supportsRequiredEnvironment } from './environment';

export function App() {
  const [environmentSupported] = useState(() => supportsRequiredEnvironment());
  const actorRef = useActorRef(gameMachine);
  const isPlaying = useSelector(actorRef, selectIsPlaying);
  const selectedHotspotId = useSelector(actorRef, selectSelectedHotspot);
  const subtitle = useSelector(actorRef, selectSubtitle);

  if (!environmentSupported) return <UnsupportedScreen />;

  if (!isPlaying) {
    return (
      <TitleScreen onStart={() => actorRef.send({ type: 'GAME_STARTED' })} />
    );
  }

  return (
    <GameScreen
      selectedHotspotId={selectedHotspotId}
      subtitle={subtitle}
      onHotspotSelected={(hotspotId) =>
        actorRef.send({ type: 'HOTSPOT_SELECTED', hotspotId })
      }
      onExit={() => actorRef.send({ type: 'RETURNED_TO_TITLE' })}
    />
  );
}
