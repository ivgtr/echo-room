import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';

import { gameMachine } from '../../src/game/machine/gameMachine';
import type { PuzzleId } from '../../src/game/puzzles/storyPuzzles';
import { createPowerRestoredProgress } from '../../src/game/save/saveManager';

const solutions: [PuzzleId, string[]][] = [
  ['puzzle_carrier_sync', ['right-2', 'none', 'left-1']],
  ['puzzle_maintenance_lock', ['double', 'ring', 'triangle', 'node']],
  [
    'puzzle_signal_investigation',
    ['s-b', 's-c', 's-a', 'signal', 'ring-relay', 'echo-buffer'],
  ],
  ['puzzle_packet_repair', ['c', 'd', 'a', 'b']],
  ['puzzle_voiceprint_calibration', ['compress-half', 'invert', 'left-2']],
  [
    'puzzle_transmission_window',
    [
      'packet-01',
      'packet-02',
      'packet-03',
      'packet-04',
      'minus-20',
      'echo-return',
    ],
  ],
];

describe('seven-puzzle story progression', () => {
  it('does not advance for a wrong answer and grants items at puzzle 3', () => {
    const actor = createActor(gameMachine).start();
    actor.send({
      type: 'PROGRESS_RESTORED',
      progress: createPowerRestoredProgress(),
    });
    actor.send({
      type: 'PUZZLE_SUBMITTED',
      puzzleId: 'puzzle_carrier_sync',
      answer: ['none', 'none', 'none'],
    });
    expect(actor.getSnapshot().context.storyStage).toBe('puzzle_carrier_sync');
    for (const [puzzleId, answer] of solutions.slice(0, 2))
      actor.send({ type: 'PUZZLE_SUBMITTED', puzzleId, answer });
    expect(actor.getSnapshot().context.inventory).toEqual([
      'item_screwdriver',
      'item_staff_card',
      'item_floor_map',
    ]);
  });

  it('requires all seven deductions before transmission and ending', () => {
    const actor = createActor(gameMachine).start();
    actor.send({
      type: 'PROGRESS_RESTORED',
      progress: createPowerRestoredProgress(),
    });
    actor.send({ type: 'TRANSMISSION_CONFIRMED' });
    expect(actor.getSnapshot().context.storyStage).toBe('puzzle_carrier_sync');
    for (const [puzzleId, answer] of solutions)
      actor.send({ type: 'PUZZLE_SUBMITTED', puzzleId, answer });
    expect(actor.getSnapshot().context.completedPuzzleIds).toHaveLength(7);
    expect(actor.getSnapshot().context.storyStage).toBe('transmission_ready');
    actor.send({ type: 'TRANSMISSION_CONFIRMED' });
    expect(actor.getSnapshot().context.storyStage).toBe('ending_transmission');
    for (let index = 0; index < 6; index += 1)
      actor.send({ type: 'ENDING_ADVANCED' });
    expect(actor.getSnapshot().context.storyStage).toBe('ending_door');
    actor.send({ type: 'ENDING_DOOR_SELECTED' });
    expect(actor.getSnapshot().context.storyStage).toBe('completed');
  });
});
