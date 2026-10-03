import { describe, expect, it } from 'vitest';

import {
  isPuzzleAnswerCorrect,
  type PuzzleId,
} from '../../src/game/puzzles/storyPuzzles';

const solutions: Record<PuzzleId, string[]> = {
  puzzle_power_route: ['terminal', 'intercom', 'buffer'],
  puzzle_carrier_sync: ['right-2', 'none', 'left-1'],
  puzzle_maintenance_lock: ['double', 'ring', 'triangle', 'node'],
  puzzle_signal_investigation: [
    's-b',
    's-c',
    's-a',
    'signal',
    'ring-relay',
    'echo-buffer',
  ],
  puzzle_packet_repair: ['c', 'd', 'a', 'b'],
  puzzle_voiceprint_calibration: ['compress-half', 'invert', 'left-2'],
  puzzle_transmission_window: [
    'packet-01',
    'packet-02',
    'packet-03',
    'packet-04',
    'minus-20',
    'echo-return',
  ],
};

describe('story puzzle validators', () => {
  it.each(Object.entries(solutions))(
    '%s accepts only its complete ordered deduction',
    (puzzleId, solution) => {
      expect(isPuzzleAnswerCorrect(puzzleId as PuzzleId, solution)).toBe(true);
      expect(
        isPuzzleAnswerCorrect(puzzleId as PuzzleId, [
          ...solution.slice(0, -1),
          'wrong',
        ]),
      ).toBe(false);
    },
  );
});
