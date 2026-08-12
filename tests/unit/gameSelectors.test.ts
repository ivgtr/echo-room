import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';

import { gameMachine } from '../../src/game/machine/gameMachine';
import {
  selectObjective,
  selectSubtitle,
} from '../../src/game/selectors/gameSelectors';

describe('exploration messaging selectors', () => {
  it('keeps the objective out of the event-only subtitle', () => {
    const actor = createActor(gameMachine).start();
    actor.send({ type: 'GAME_STARTED' });
    for (let index = 0; index < 7; index += 1) {
      actor.send({ type: 'DIALOGUE_ADVANCED' });
    }

    expect(selectObjective(actor.getSnapshot())).toContain(
      '机のメモと壊れた回路',
    );
    expect(selectSubtitle(actor.getSnapshot())).toBeNull();
  });

  it('clears a direct-inspection message when the player closes it', () => {
    const actor = createActor(gameMachine).start();
    actor.send({ type: 'GAME_STARTED' });
    for (let index = 0; index < 7; index += 1) {
      actor.send({ type: 'DIALOGUE_ADVANCED' });
    }
    actor.send({ type: 'HOTSPOT_SELECTED', hotspotId: 'hotspot_door' });
    expect(selectSubtitle(actor.getSnapshot())).toContain('非常ロック');

    actor.send({ type: 'PUZZLE_CLOSED' });
    expect(selectSubtitle(actor.getSnapshot())).toBeNull();
  });
});
