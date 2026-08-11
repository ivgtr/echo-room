import { readFile } from 'node:fs/promises';
import process from 'node:process';

import { parse } from 'yaml';
import { z } from 'zod';

const rootSchema = z.object({
  schemaVersion: z.literal(1),
  contentVersion: z.string().min(1),
  chapters: z.array(z.object({ id: z.string() })).min(8),
  locations: z.array(z.object({ id: z.string() })).min(4),
  hotspots: z
    .array(z.object({ id: z.string(), locationId: z.string() }))
    .min(7),
  items: z.array(z.object({ id: z.string() })).length(3),
  documents: z.array(z.object({ id: z.string() })).min(3),
  dialogues: z.array(z.object({ id: z.string(), text: z.string() })).min(8),
  puzzles: z
    .array(z.object({ id: z.string(), hintIds: z.array(z.string()).length(3) }))
    .length(7),
  hints: z
    .array(
      z.object({ id: z.string(), puzzleId: z.string(), level: z.number() }),
    )
    .length(21),
  storyFacts: z.object({
    wallClock: z.literal('02:17'),
    negativeDelay: z.literal('-00:20:00'),
    lockerCode: z.literal('0237'),
    finalSlots: z.literal(4),
    receiveTimes: z.array(z.string()).length(3),
    sourceTimes: z.array(z.string()).length(3),
    packets: z.array(z.string()).length(4),
  }),
});

const unique = (values, label) => {
  if (new Set(values).size !== values.length)
    throw new Error(`${label}: duplicate ID`);
};

try {
  const source = await readFile(
    new URL('../src/content/story.yaml', import.meta.url),
    'utf8',
  );
  const content = rootSchema.parse(parse(source));
  for (const key of [
    'chapters',
    'locations',
    'hotspots',
    'items',
    'documents',
    'dialogues',
    'puzzles',
    'hints',
  ])
    unique(
      content[key].map(({ id }) => id),
      key,
    );
  const locationIds = new Set(content.locations.map(({ id }) => id));
  const puzzleIds = new Set(content.puzzles.map(({ id }) => id));
  const hintIds = new Set(content.hints.map(({ id }) => id));
  for (const hotspot of content.hotspots)
    if (!locationIds.has(hotspot.locationId))
      throw new Error(`Unknown location: ${hotspot.locationId}`);
  for (const puzzle of content.puzzles)
    for (const hintId of puzzle.hintIds)
      if (!hintIds.has(hintId)) throw new Error(`Unknown hint: ${hintId}`);
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
    if (sourceTime - receive !== 1_200_000)
      throw new Error('Transmission offset must be exactly 20 minutes');
  }
  const packetDialogues = [1, 2, 3, 4].map(
    (number) =>
      content.dialogues.find(({ id }) => id === `dialogue_packet_0${number}`)
        ?.text,
  );
  if (
    JSON.stringify(packetDialogues) !==
    JSON.stringify(content.storyFacts.packets)
  )
    throw new Error('PACKET dialogue mismatch');
  console.log(
    'Content validation passed (schema, references, 20-minute offset, PACKET text).',
  );
} catch (error) {
  console.error('Content validation failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
