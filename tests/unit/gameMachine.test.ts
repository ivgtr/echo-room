import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';

import { gameMachine } from '../../src/game/machine/gameMachine';

const enterPuzzle = () => {
  const actor = createActor(gameMachine).start();
  actor.send({ type: 'GAME_STARTED' });
  for (let index = 0; index < 7; index += 1)
    actor.send({ type: 'DIALOGUE_ADVANCED' });
  actor.send({ type: 'VIEW_CHANGED', locationId: 'location_west_wall' });
  actor.send({ type: 'HOTSPOT_SELECTED', hotspotId: 'hotspot_breaker' });
  return actor;
};

describe('gameMachine vertical slice', () => {
  it('does not accept exploration events before the introduction ends', () => {
    const actor = createActor(gameMachine).start();
    actor.send({ type: 'GAME_STARTED' });
    actor.send({ type: 'VIEW_CHANGED', locationId: 'location_west_wall' });
    expect(actor.getSnapshot().context.locationId).toBe('location_north_wall');
  });

  it('restores every lever after an incorrect input and permits a retry', () => {
    const actor = enterPuzzle();
    actor.send({ type: 'BREAKER_TOGGLED', breakerId: 'breaker_1' });
    expect(actor.getSnapshot().context.breakerSequence).toEqual([]);
    expect(actor.getSnapshot().context.breakerFailures).toBe(1);
    expect(actor.getSnapshot().matches({ playing: 'breakerPuzzle' })).toBe(
      true,
    );
  });

  it('restores power only for the low-to-high order', () => {
    const actor = enterPuzzle();
    for (const breakerId of [
      'breaker_3',
      'breaker_1',
      'breaker_4',
      'breaker_2',
    ] as const) {
      actor.send({ type: 'BREAKER_TOGGLED', breakerId });
    }
    expect(actor.getSnapshot().matches({ playing: 'powered' })).toBe(true);
    expect(actor.getSnapshot().context.powerRestored).toBe(true);
    expect(actor.getSnapshot().context.locationId).toBe('location_east_wall');
  });

  it('restores directly to the safe powered checkpoint', () => {
    const actor = createActor(gameMachine).start();
    actor.send({ type: 'PROGRESS_RESTORED' });
    expect(actor.getSnapshot().matches({ playing: 'powered' })).toBe(true);
    expect(actor.getSnapshot().context.powerRestored).toBe(true);
  });
});
