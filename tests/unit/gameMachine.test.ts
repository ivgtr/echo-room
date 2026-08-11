import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';

import { gameMachine } from '../../src/game/machine/gameMachine';
import { EMERGENCY_POWER_DURATION_MS } from '../../src/game/time/emergencyPower';

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
    actor.send({
      type: 'PROGRESS_RESTORED',
      activeElapsedMs: 0,
      reservePower: false,
    });
    expect(actor.getSnapshot().matches({ playing: 'powered' })).toBe(true);
    expect(actor.getSnapshot().context.powerRestored).toBe(true);
  });

  it('enters reserve power at zero without blocking game progression', () => {
    const actor = createActor(gameMachine).start();
    actor.send({
      type: 'PROGRESS_RESTORED',
      activeElapsedMs: EMERGENCY_POWER_DURATION_MS - 10,
      reservePower: false,
    });
    actor.send({ type: 'ACTIVE_TIME_ELAPSED', deltaMs: 10 });
    expect(actor.getSnapshot().context.reservePower).toBe(true);
    actor.send({ type: 'LOGS_CONFIRMED' });
    expect(actor.getSnapshot().context.storyStage).toBe('unlock_locker');
  });
});
