import { parse } from 'yaml';
import { z } from 'zod';

const id = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}_[a-z0-9_]+$`));

const conditionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('puzzleSolved'), puzzleId: id('puzzle') }),
  z.object({ type: z.literal('itemOwned'), itemId: id('item') }),
  z.object({ type: z.literal('inspected'), hotspotId: id('hotspot') }),
]);

const effectSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('setObjective'), objectiveId: id('objective') }),
  z.object({ type: z.literal('grantItem'), itemId: id('item') }),
  z.object({ type: z.literal('advanceChapter'), chapterId: id('chapter') }),
  z.object({
    type: z.literal('unlockTerminal'),
    menuId: z.enum(['system', 'log', 'audio', 'security']),
  }),
]);

export const gameContentSchema = z.object({
  schemaVersion: z.literal(2),
  contentVersion: z.string().min(1),
  chapters: z
    .array(z.object({ id: id('chapter'), label: z.string().min(1) }))
    .min(9),
  locations: z
    .array(z.object({ id: id('location'), label: z.string().min(1) }))
    .min(4),
  hotspots: z
    .array(
      z.object({
        id: id('hotspot'),
        locationId: id('location'),
        label: z.string().min(1),
        conditions: z.array(conditionSchema).default([]),
      }),
    )
    .min(7),
  items: z.array(z.object({ id: id('item'), label: z.string().min(1) })).min(3),
  documents: z
    .array(
      z.object({
        id: id('document'),
        title: z.string().min(1),
        body: z.string().min(1),
      }),
    )
    .min(3),
  dialogues: z
    .array(
      z
        .object({
          id: id('dialogue'),
          speaker: z.enum(['protagonist', 'future_protagonist', 'system']),
          text: z.string().min(1),
        })
        .strict(),
    )
    .min(8),
  puzzles: z
    .array(
      z.object({
        id: id('puzzle'),
        kind: z.enum([
          'routing',
          'calibration',
          'correlation',
          'reconstruction',
        ]),
        correctAnswer: z.array(z.string()).min(2),
        incorrectFeedback: z.string().min(1),
        effects: z.array(effectSchema).min(1),
        hintIds: z.array(id('hint')).length(3),
      }),
    )
    .length(7),
  hints: z
    .array(
      z.object({
        id: id('hint'),
        puzzleId: id('puzzle'),
        level: z.number().int().min(1).max(3),
        text: z.string().min(1),
      }),
    )
    .length(21),
  storyFacts: z.object({
    wallClock: z.literal('02:17'),
    negativeDelay: z.literal('-00:20:00'),
    finalSlots: z.literal(4),
    silentPlay: z.literal(true),
    receiveTimes: z.tuple([z.string(), z.string(), z.string()]),
    sourceTimes: z.tuple([z.string(), z.string(), z.string()]),
    packets: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  }),
});

export type GameContent = z.infer<typeof gameContentSchema>;

const assertUnique = (ids: string[], kind: string) => {
  if (new Set(ids).size !== ids.length)
    throw new Error(`${kind} ID is duplicated`);
};

export const parseGameContent = (source: string): GameContent => {
  const content = gameContentSchema.parse(parse(source));
  assertUnique(
    content.chapters.map(({ id }) => id),
    'chapter',
  );
  assertUnique(
    content.hotspots.map(({ id }) => id),
    'hotspot',
  );
  assertUnique(
    content.dialogues.map(({ id }) => id),
    'dialogue',
  );
  assertUnique(
    content.puzzles.map(({ id }) => id),
    'puzzle',
  );
  assertUnique(
    content.hints.map(({ id }) => id),
    'hint',
  );
  const puzzleIds = new Set(content.puzzles.map(({ id }) => id));
  const hintIds = new Set(content.hints.map(({ id }) => id));
  for (const puzzle of content.puzzles) {
    for (const hintId of puzzle.hintIds)
      if (!hintIds.has(hintId)) throw new Error(`Unknown hint: ${hintId}`);
  }
  for (const hint of content.hints)
    if (!puzzleIds.has(hint.puzzleId))
      throw new Error(`Unknown puzzle: ${hint.puzzleId}`);
  for (let index = 0; index < 3; index += 1) {
    const receive = new Date(
      `2039-01-01T${content.storyFacts.receiveTimes[index]}Z`,
    ).getTime();
    const sourceTime = new Date(
      `2039-01-01T${content.storyFacts.sourceTimes[index]}Z`,
    ).getTime();
    if (sourceTime - receive !== 20 * 60 * 1000)
      throw new Error('Transmission offset is not exactly 20 minutes');
  }
  return content;
};
