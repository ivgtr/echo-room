import { access, readFile } from 'node:fs/promises';
import process from 'node:process';
import { basename } from 'node:path';
import { voiceAssets } from '../src/audio/voiceManifest.ts';

import { z } from 'zod';

const imageSchema = z.object({
  id: z.string().min(1),
  src: z.string().regex(/^\/assets\/.+\.(?:png|webp)$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const assetSchema = z.object({
  schemaVersion: z.literal(1),
  contentVersion: z.string().min(1),
  bundles: z
    .array(
      z.object({
        id: z.string().min(1),
        images: z.array(imageSchema).min(1),
      }),
    )
    .min(1),
  placeholderPolicy: z.literal('missing_assets_only'),
});

try {
  const manifestUrl = new URL(
    '../public/assets/manifests/assets.json',
    import.meta.url,
  );
  const source = await readFile(manifestUrl, 'utf8');
  const manifest = assetSchema.parse(JSON.parse(source));
  const bundleIds = new Set();
  const imageIds = new Set();

  for (const bundle of manifest.bundles) {
    if (bundleIds.has(bundle.id))
      throw new Error(`Duplicate bundle: ${bundle.id}`);
    bundleIds.add(bundle.id);
    for (const image of bundle.images) {
      if (imageIds.has(image.id))
        throw new Error(`Duplicate image: ${image.id}`);
      imageIds.add(image.id);
      await access(new URL(`../public${image.src}`, import.meta.url));
    }
  }

  for (const url of Object.values(voiceAssets)) {
    if (
      !/^https:\/\/raw\.githubusercontent\.com\/ivgtr\/echo-room\/[a-f0-9]{40}\/audio\/voice\//.test(
        url,
      )
    )
      throw new Error('Voice assets must use a fixed Git commit');
    const bytes = await readFile(
      new URL(`../audio/voice/${basename(url)}`, import.meta.url),
    );
    if (
      bytes.toString('ascii', 0, 4) !== 'RIFF' ||
      bytes.toString('ascii', 8, 12) !== 'WAVE'
    )
      throw new Error(`Invalid voice WAV: ${basename(url)}`);
  }

  console.log(
    `Asset validation passed (${bundleIds.size} bundles, ${imageIds.size} images, ${Object.keys(voiceAssets).length} Git-hosted voice masters, all files present).`,
  );
} catch (error) {
  console.error('Asset validation failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
