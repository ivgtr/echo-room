import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';

import { gameMachine } from '../../src/game/machine/gameMachine';
import { createPowerRestoredProgress } from '../../src/game/save/saveManager';
import { EMERGENCY_POWER_DURATION_MS } from '../../src/game/time/emergencyPower';

describe('gameMachine', () => {
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
          'puzzle_signal_investigation',
          'puzzle_packet_repair',
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
