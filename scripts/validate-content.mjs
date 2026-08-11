import { readFile } from 'node:fs/promises';
import process from 'node:process';

import { parse } from 'yaml';
import { z } from 'zod';

const projectSchema = z.object({
  schemaVersion: z.literal(1),
  contentVersion: z.string().min(1),
  projectId: z.literal('echo-room'),
  initialChapterId: z.string().regex(/^chapter_[a-z0-9_]+$/),
});

try {
  const source = await readFile(
    new URL('../src/content/project.yaml', import.meta.url),
    'utf8',
  );
  projectSchema.parse(parse(source));
  console.log('Content validation passed (project metadata).');
} catch (error) {
  console.error('Content validation failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
