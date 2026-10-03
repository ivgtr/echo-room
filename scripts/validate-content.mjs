import { readFile } from 'node:fs/promises';
import process from 'node:process';

import { parseGameContent } from '../src/game/content/schema.ts';

try {
  const content = parseGameContent(
    await readFile(
      new URL('../src/content/story.yaml', import.meta.url),
      'utf8',
    ),
  );
  for (const [key, entries] of Object.entries(content)) {
    if (
      Array.isArray(entries) &&
      entries[0]?.id &&
      new Set(entries.map(({ id }) => id)).size !== entries.length
    )
      throw new Error(`${key}: duplicate ID`);
  }
  const locationIds = new Set(content.locations.map(({ id }) => id));
  for (const hotspot of content.hotspots)
    if (!locationIds.has(hotspot.locationId))
      throw new Error(`Unknown location: ${hotspot.locationId}`);
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
