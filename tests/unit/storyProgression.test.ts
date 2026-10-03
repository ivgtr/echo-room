import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';

import { gameMachine } from '../../src/game/machine/gameMachine';
import { selectCurrentPuzzleId } from '../../src/game/selectors/gameSelectors';
import type { PuzzleId } from '../../src/game/puzzles/storyPuzzles';
import { endingEntries } from '../../src/ui/narrative/narrativeArchive';

const solutions: [PuzzleId, string[]][] = [
  ['puzzle_power_route', ['terminal', 'intercom', 'buffer']],
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
  it('rejects early transmission and a wrong answer, then reaches the ending through all seven puzzles', () => {
    const actor = createActor(gameMachine).start();
    expect(selectCurrentPuzzleId(actor.getSnapshot())).toBeNull();
    actor.send({ type: 'GAME_STARTED' });
    actor.send({ type: 'HINT_REQUESTED' });
    expect(actor.getSnapshot().context.hintLevel).toBe(0);
    actor.send({ type: 'DIALOGUE_SKIPPED' });
    expect(selectCurrentPuzzleId(actor.getSnapshot())).toBe(
      'puzzle_power_route',
    );
    actor.send({ type: 'HINT_REQUESTED' });
    expect(actor.getSnapshot().context.hintLevel).toBe(1);
    actor.send({ type: 'VIEW_CHANGED', locationId: 'location_west_wall' });
    actor.send({ type: 'HOTSPOT_SELECTED', hotspotId: 'hotspot_breaker' });
    actor.send({ type: 'HINT_REQUESTED' });
    actor.send({ type: 'HINT_REQUESTED' });
    actor.send({ type: 'HINT_REQUESTED' });
    expect(actor.getSnapshot().context.hintLevel).toBe(3);
    actor.send({
      type: 'PUZZLE_SUBMITTED',
      puzzleId: 'puzzle_power_route',
      answer: ['door'],
    });
    expect(actor.getSnapshot().context.puzzleFailures.puzzle_power_route).toBe(
      1,
    );
    expect(actor.getSnapshot().matches({ playing: 'breakerPuzzle' })).toBe(
      true,
    );
    for (const [puzzleId, answer] of solutions) {
      actor.send({ type: 'PUZZLE_SUBMITTED', puzzleId, answer });
      if (puzzleId === 'puzzle_power_route') {
        expect(actor.getSnapshot().context.hintLevel).toBe(0);
        expect(selectCurrentPuzzleId(actor.getSnapshot())).toBe(
          'puzzle_carrier_sync',
        );
        actor.send({ type: 'TRANSMISSION_CONFIRMED' });
        actor.send({
          type: 'PUZZLE_SUBMITTED',
          puzzleId: 'puzzle_transmission_window',
          answer: solutions.at(-1)![1],
        });
        expect(actor.getSnapshot().context.storyStage).toBe(
          'puzzle_carrier_sync',
        );
        expect(actor.getSnapshot().context.completedPuzzleIds).toEqual([
          'puzzle_power_route',
        ]);
      }
      if (puzzleId === 'puzzle_maintenance_lock')
        expect(actor.getSnapshot().context.inventory).toEqual([
          'item_screwdriver',
          'item_staff_card',
          'item_floor_map',
        ]);
    }
    expect(actor.getSnapshot().context.completedPuzzleIds).toHaveLength(7);
    expect(actor.getSnapshot().context.storyStage).toBe('transmission_ready');
    actor.send({ type: 'TRANSMISSION_CONFIRMED' });
    expect(actor.getSnapshot().context.storyStage).toBe('ending_transmission');
    for (let index = 0; index < endingEntries.length; index += 1)
      actor.send({ type: 'ENDING_ADVANCED' });
    expect(actor.getSnapshot().context.storyStage).toBe('ending_door');
    actor.send({ type: 'ENDING_DOOR_SELECTED' });
    expect(actor.getSnapshot().context.storyStage).toBe('completed');
    actor.stop();
  });
});
