import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';

import { gameMachine } from '../../src/game/machine/gameMachine';
import { createPowerRestoredProgress } from '../../src/game/save/saveManager';
import { EMERGENCY_POWER_DURATION_MS } from '../../src/game/time/emergencyPower';

const enterPowerPuzzle = () => {
  const actor = createActor(gameMachine).start();
  actor.send({ type: 'GAME_STARTED' });
  for (let index = 0; index < 7; index += 1)
    actor.send({ type: 'DIALOGUE_ADVANCED' });
  actor.send({ type: 'VIEW_CHANGED', locationId: 'location_west_wall' });
  actor.send({ type: 'HOTSPOT_SELECTED', hotspotId: 'hotspot_breaker' });
  return actor;
};

describe('gameMachine vertical slice', () => {
  it('skips an already-read introduction as one state transition', () => {
    const actor = createActor(gameMachine).start();
    actor.send({ type: 'GAME_STARTED' });
    actor.send({ type: 'DIALOGUE_SKIPPED' });
    expect(actor.getSnapshot().matches({ playing: 'exploring' })).toBe(true);
  });

  it('rejects an unsafe power route and permits a retry', () => {
    const actor = enterPowerPuzzle();
    actor.send({
      type: 'PUZZLE_SUBMITTED',
      puzzleId: 'puzzle_power_route',
      answer: ['terminal', 'door', 'intercom', 'buffer'],
    });
    expect(actor.getSnapshot().matches({ playing: 'breakerPuzzle' })).toBe(
      true,
    );
    expect(actor.getSnapshot().context.puzzleFailures.puzzle_power_route).toBe(
      1,
    );
  });

  it('restores power only for the capacity-safe route', () => {
    const actor = enterPowerPuzzle();
    actor.send({
      type: 'PUZZLE_SUBMITTED',
      puzzleId: 'puzzle_power_route',
      answer: ['door', 'terminal', 'intercom', 'buffer'],
    });
    expect(actor.getSnapshot().matches({ playing: 'powered' })).toBe(true);
    expect(actor.getSnapshot().context.completedPuzzleIds).toEqual([
      'puzzle_power_route',
    ]);
  });

  it('restores current-only domain progress without replaying rewards', () => {
    const actor = createActor(gameMachine).start();
    actor.send({
      type: 'PROGRESS_RESTORED',
      progress: createPowerRestoredProgress({
        checkpointId: 'checkpoint_puzzle_07',
        storyStage: 'puzzle_voiceprint_calibration',
        inventory: ['item_screwdriver', 'item_staff_card', 'item_floor_map'],
        completedPuzzleIds: [
          'puzzle_power_route',
          'puzzle_carrier_sync',
          'puzzle_maintenance_lock',
          'puzzle_log_pairing',
          'puzzle_signal_route',
          'puzzle_packet_repair',
          'puzzle_temporal_anomaly',
        ],
      }),
    });
    expect(actor.getSnapshot().context.storyStage).toBe(
      'puzzle_voiceprint_calibration',
    );
    expect(actor.getSnapshot().context.inventory).toHaveLength(3);
    expect(actor.getSnapshot().context.terminalMenuId).toBe('system');
  });

  it('enters reserve power at zero without blocking progression', () => {
    const actor = createActor(gameMachine).start();
    actor.send({
      type: 'PROGRESS_RESTORED',
      progress: createPowerRestoredProgress({
        activeElapsedMs: EMERGENCY_POWER_DURATION_MS - 10,
      }),
    });
    actor.send({ type: 'ACTIVE_TIME_ELAPSED', deltaMs: 10 });
    actor.send({
      type: 'PUZZLE_SUBMITTED',
      puzzleId: 'puzzle_carrier_sync',
      answer: ['right-2', 'none', 'left-1'],
    });
    expect(actor.getSnapshot().context.reservePower).toBe(true);
    expect(actor.getSnapshot().context.storyStage).toBe(
      'puzzle_maintenance_lock',
    );
  });
});
