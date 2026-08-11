import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseGameContent } from '../../src/game/content/schema';

const storySource = readFileSync('src/content/story.yaml', 'utf8');

describe('game content schema', () => {
  it('loads all seven puzzles and their three-stage hints', () => {
    const content = parseGameContent(storySource);
    expect(content.puzzles).toHaveLength(7);
    expect(content.hints).toHaveLength(21);
  });

  it('rejects a story timestamp that is not exactly twenty minutes apart', () => {
    const invalid = storySource.replace('02:37:18', '02:38:18');
    expect(() => parseGameContent(invalid)).toThrow('exactly 20 minutes');
  });

  it('rejects duplicate stable IDs', () => {
    const invalid = storySource.replace(
      'dialogue_packet_02',
      'dialogue_packet_01',
    );
    expect(() => parseGameContent(invalid)).toThrow(
      'dialogue ID is duplicated',
    );
  });

  it('rejects spoken-audio references in dialogue data', () => {
    const invalid = storySource.replace(
      "text: '……聞こえるか？',",
      "text: '……聞こえるか？', audioId: audio_packet_01,",
    );
    expect(() => parseGameContent(invalid)).toThrow();
  });
});
