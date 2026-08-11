import { describe, expect, it } from 'vitest';

import {
  isPuzzleAnswerCorrect,
  puzzleIds,
  type PuzzleId,
} from '../../src/game/puzzles/storyPuzzles';
import { getPuzzleCompletionEntries } from '../../src/ui/narrative/narrativeArchive';

const solutions: Record<PuzzleId, string[]> = {
  puzzle_power_route: ['door', 'terminal', 'intercom', 'buffer'],
  puzzle_carrier_sync: ['right-2', 'none', 'left-1'],
  puzzle_maintenance_lock: ['double', 'ring', 'triangle', 'node'],
  puzzle_log_pairing: ['s-b', 's-c', 's-a'],
  puzzle_signal_route: ['signal', 'ring-relay', 'echo-buffer'],
  puzzle_packet_repair: ['c', 'd', 'a', 'b'],
  puzzle_temporal_anomaly: ['packet-04', 'unseen-event'],
  puzzle_voiceprint_calibration: ['compress-half', 'invert', 'left-2'],
  puzzle_causal_script: ['packet-01', 'packet-02', 'packet-03', 'packet-04'],
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
  it('gives every solved device an in-world consequence or lead', () => {
    for (const puzzleId of puzzleIds)
      expect(getPuzzleCompletionEntries(puzzleId).length).toBeGreaterThan(0);
  });

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
      expect(
        isPuzzleAnswerCorrect(puzzleId as PuzzleId, solution.slice(0, -1)),
      ).toBe(false);
    },
  );
});
