import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {access, mkdir, readFile} from 'node:fs/promises';
import {constants as fsConstants} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {defaultVideoInput, VideoInput} from '../src/types/video-input';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const entryPoint = path.join(projectRoot, 'src/index.ts');

const inputArg = process.argv[2] ?? 'data/promo.example.json';
const outputArg = process.argv[3] ?? 'out/promo.mp4';

const resolveFromRoot = (value: string) =>
  path.isAbsolute(value) ? value : path.join(projectRoot, value);

const HTTP_PATTERN = /^https?:\/\//i;

const normalizeMediaPath = (value: string): string => {
  return value
    .trim()
    .replace(/^\.\/+/, '')
    .replace(/^\/+/, '')
    .replace(/^public\//, '');
};

const assertLocalAssetExists = async (
  mediaPath: string,
  fieldName: 'promoVideoPath' | 'musicPath',
) => {
  if (HTTP_PATTERN.test(mediaPath)) {
    return;
  }

  const normalized = normalizeMediaPath(mediaPath);
  const absolutePath = path.join(projectRoot, 'public', normalized);

  try {
    await access(absolutePath, fsConstants.R_OK);
  } catch {
    throw new Error(
      `Missing file for ${fieldName}: "${mediaPath}"\n` +
        `Expected file at: ${absolutePath}\n` +
        `Tip: place your media in /public and use paths like "videos/my-file.mp4" or "audio/my-music.mp3".`,
    );
  }
};

const parseInputProps = async (jsonPath: string): Promise<VideoInput> => {
  const raw = await readFile(jsonPath, 'utf-8');
  const parsed = JSON.parse(raw) as Partial<VideoInput>;

  const merged: VideoInput = {
    ...defaultVideoInput,
    ...parsed,
    vocabulary: parsed.vocabulary ?? defaultVideoInput.vocabulary,
    captions: parsed.captions ?? defaultVideoInput.captions,
  };

  if (!merged.hookText) {
    throw new Error('Missing required field: hookText');
  }

  if (!merged.promoVideoPath) {
    throw new Error('Missing required field: promoVideoPath');
  }

  if (!merged.ctaText) {
    throw new Error('Missing required field: ctaText');
  }

  merged.promoVideoPath = normalizeMediaPath(merged.promoVideoPath);
  if (merged.musicPath) {
    merged.musicPath = normalizeMediaPath(merged.musicPath);
  }

  await assertLocalAssetExists(merged.promoVideoPath, 'promoVideoPath');
  if (merged.musicPath) {
    await assertLocalAssetExists(merged.musicPath, 'musicPath');
  }

  return merged;
};

const run = async () => {
  const inputPath = resolveFromRoot(inputArg);
  const outputPath = resolveFromRoot(outputArg);
  const inputProps = await parseInputProps(inputPath);

  await mkdir(path.dirname(outputPath), {recursive: true});

  console.log(`Bundling Remotion project from: ${entryPoint}`);
  const bundledProject = await bundle({entryPoint});

  console.log('Selecting composition: PromoVideo');
  const composition = await selectComposition({
    serveUrl: bundledProject,
    id: 'PromoVideo',
    inputProps,
  });

  console.log(`Rendering MP4 to: ${outputPath}`);
  await renderMedia({
    composition,
    serveUrl: bundledProject,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
  });

  console.log('Render complete.');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
