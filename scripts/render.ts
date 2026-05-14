import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {constants as fsConstants} from 'node:fs';
import {access, mkdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {
  AnyVideoInput,
  defaultQuiz2ChoicesInput,
  defaultVideoInput,
  PromoVideoInput,
  Quiz2ChoicesInput,
} from '../src/types/video-input';

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

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const parseInputJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    // Tolerate two top-level JSON objects pasted one after another: {...}{...}
    const maybeConcatenated = raw.trim().replace(/}\s*{/g, '},{');
    try {
      return JSON.parse(`[${maybeConcatenated}]`) as unknown;
    } catch {
      throw new Error(
        'Invalid JSON input. Please provide a valid JSON object or array. ' +
          'If you pasted multiple objects, wrap them in an array.',
      );
    }
  }
};

const pickRootObject = (value: unknown): Record<string, unknown> => {
  if (Array.isArray(value)) {
    const firstObject = value.find((item) => asRecord(item));
    const rootObject = asRecord(firstObject);
    if (!rootObject) {
      throw new Error('JSON array does not contain a valid object.');
    }

    return rootObject;
  }

  const rootObject = asRecord(value);
  if (!rootObject) {
    throw new Error('Input must be a JSON object.');
  }

  return rootObject;
};

const readString = (
  obj: Record<string, unknown>,
  key: string,
  required = false,
): string => {
  const value = obj[key];

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  if (required) {
    throw new Error(`Missing required field: ${key}`);
  }

  return '';
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
        'Tip: place your media in /public and use paths like "videos/my-file.mp4" or "audio/my-music.mp3".',
    );
  }
};

const parsePromoInput = async (
  parsed: Record<string, unknown>,
): Promise<PromoVideoInput> => {
  const merged: PromoVideoInput = {
    ...defaultVideoInput,
    ...parsed,
    vocabulary: Array.isArray(parsed.vocabulary)
      ? (parsed.vocabulary as string[])
      : defaultVideoInput.vocabulary,
    captions: Array.isArray(parsed.captions)
      ? (parsed.captions as PromoVideoInput['captions'])
      : defaultVideoInput.captions,
    type: 'promo',
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

const parseQuizInput = (parsed: Record<string, unknown>): Quiz2ChoicesInput => {
  const rawQuestions = parsed.questions;

  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    throw new Error('Missing required field: questions (non-empty array)');
  }

  const questions = rawQuestions.map((question, questionIndex) => {
    const obj = asRecord(question);
    if (!obj) {
      throw new Error(`Question at index ${questionIndex} must be an object.`);
    }

    const word = readString(obj, 'word', true);
    const rawChoices = obj.choices;
    if (!Array.isArray(rawChoices) || rawChoices.length < 2) {
      throw new Error(
        `Question "${word}" must contain a choices array with exactly 2 items.`,
      );
    }

    const choiceA = String(rawChoices[0] ?? '').trim();
    const choiceB = String(rawChoices[1] ?? '').trim();

    if (!choiceA || !choiceB) {
      throw new Error(`Question "${word}" has empty choices.`);
    }

    const rawCorrect = obj.correct;
    if (rawCorrect !== 0 && rawCorrect !== 1) {
      throw new Error(
        `Question "${word}" has invalid correct index "${String(
          rawCorrect,
        )}". Use 0 or 1.`,
      );
    }

    return {
      word,
      choices: [choiceA, choiceB] as [string, string],
      correct: rawCorrect as 0 | 1,
    };
  });

  return {
    type: 'quiz_2_choices',
    title:
      readString(parsed, 'title') ||
      defaultQuiz2ChoicesInput.title ||
      'Quiz 2 Choices',
    cta:
      readString(parsed, 'cta') ||
      defaultQuiz2ChoicesInput.cta ||
      'Learn while browsing',
    accentColor:
      readString(parsed, 'accentColor') ||
      defaultQuiz2ChoicesInput.accentColor,
    questions,
  };
};

type RenderSelection = {
  compositionId: 'PromoVideo' | 'Quiz2ChoicesVideo';
  inputProps: AnyVideoInput;
};

const parseRenderSelection = async (jsonPath: string): Promise<RenderSelection> => {
  const raw = await readFile(jsonPath, 'utf-8');
  const parsedJson = parseInputJson(raw);
  const root = pickRootObject(parsedJson);

  if (root.type === 'quiz_2_choices') {
    return {
      compositionId: 'Quiz2ChoicesVideo',
      inputProps: parseQuizInput(root),
    };
  }

  return {
    compositionId: 'PromoVideo',
    inputProps: await parsePromoInput(root),
  };
};

const run = async () => {
  const inputPath = resolveFromRoot(inputArg);
  const outputPath = resolveFromRoot(outputArg);
  const selection = await parseRenderSelection(inputPath);

  await mkdir(path.dirname(outputPath), {recursive: true});

  console.log(`Bundling Remotion project from: ${entryPoint}`);
  const bundledProject = await bundle({entryPoint});

  console.log(`Selecting composition: ${selection.compositionId}`);
  const composition = await selectComposition({
    serveUrl: bundledProject,
    id: selection.compositionId,
    inputProps: selection.inputProps,
  });

  console.log(`Rendering MP4 to: ${outputPath}`);
  await renderMedia({
    composition,
    serveUrl: bundledProject,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: selection.inputProps,
  });

  console.log('Render complete.');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
