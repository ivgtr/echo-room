import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';

import { gameMachine } from '../../src/game/machine/gameMachine';

describe('gameMachine', () => {
  it('starts at the title and enters the playable state', () => {
    const actor = createActor(gameMachine).start();

    expect(actor.getSnapshot().matches('title')).toBe(true);
    actor.send({ type: 'GAME_STARTED' });
    expect(actor.getSnapshot().matches('playing')).toBe(true);
  });

  it('accepts world events only while playing and clears them on exit', () => {
    const actor = createActor(gameMachine).start();

    actor.send({ type: 'HOTSPOT_SELECTED', hotspotId: 'hotspot_door' });
    expect(actor.getSnapshot().context.selectedHotspotId).toBeNull();

    actor.send({ type: 'GAME_STARTED' });
    actor.send({ type: 'HOTSPOT_SELECTED', hotspotId: 'hotspot_door' });
    expect(actor.getSnapshot().context.selectedHotspotId).toBe('hotspot_door');

    actor.send({ type: 'RETURNED_TO_TITLE' });
    expect(actor.getSnapshot().matches('title')).toBe(true);
    expect(actor.getSnapshot().context.selectedHotspotId).toBeNull();
  });
});
