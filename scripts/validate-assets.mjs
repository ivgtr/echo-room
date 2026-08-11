import { readFile } from 'node:fs/promises';
import process from 'node:process';

import { z } from 'zod';

const assetSchema = z.object({
  schemaVersion: z.literal(1),
  contentVersion: z.string().min(1),
  bundles: z.array(z.object({ id: z.string(), images: z.array(z.unknown()) })),
  placeholderPolicy: z.literal('runtime_canvas'),
});

try {
  const source = await readFile(
    new URL('../public/assets/manifests/assets.json', import.meta.url),
    'utf8',
  );
  assetSchema.parse(JSON.parse(source));
  console.log(
    'Asset validation passed (empty P1 manifest; runtime Canvas placeholders enabled).',
  );
} catch (error) {
  console.error('Asset validation failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
