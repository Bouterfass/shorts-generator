import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {access, mkdir, mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {
  getVocabularyListIntroFrames,
  getVocabularyListRowDurationInFrames,
  VIDEO_CONFIG,
  VOCABULARY_LIST_CONFIG,
} from '../src/constants';
import {
  AnyVideoInput,
  defaultGrammarMistakeInput,
  defaultQuiz2ChoicesInput,
  defaultVideoInput,
  GrammarMistakeInput,
  PromoVideoInput,
  Quiz2ChoicesInput,
  VocabularyListInput,
  VocabularyListWord,
  VocabularyVoiceSegment,
} from '../src/types/video-input';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const entryPoint = path.join(projectRoot, 'src/index.ts');
const publicDir = path.join(projectRoot, 'public');
const ttsCacheDir = path.join(publicDir, 'audio', 'tts-cache');

const inputArg = process.argv[2] ?? 'data/promo.example.json';
const outputArg = process.argv[3] ?? 'out/promo.mp4';
const templateArg = process.argv[4] ?? 'auto';

type TemplateChoice =
  | 'auto'
  | 'promo'
  | 'quiz_2_choices'
  | 'grammar_mistake'
  | 'spot_error'
  | 'vocabulary_list';

const parseTemplateChoice = (value: string): TemplateChoice => {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'auto' ||
    normalized === 'promo' ||
    normalized === 'quiz_2_choices' ||
    normalized === 'grammar_mistake' ||
    normalized === 'spot_error' ||
    normalized === 'vocabulary_list'
  ) {
    return normalized;
  }

  return 'auto';
};

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

const toPosixPath = (value: string): string => {
  return value.split(path.sep).join('/');
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
  fieldName: string,
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

const parseGrammarMistakeInput = async (
  parsed: Record<string, unknown>,
): Promise<GrammarMistakeInput> => {
  const typeValue = readString(parsed, 'type');
  const isSpotErrorAlias = typeValue === 'spot_error';
  const hasMusicPathField = Object.prototype.hasOwnProperty.call(parsed, 'musicPath');
  const rawMusicPath = parsed.musicPath;

  let musicPath: string | undefined;

  if (hasMusicPathField) {
    if (typeof rawMusicPath === 'string') {
      const trimmed = rawMusicPath.trim();
      musicPath = trimmed.length > 0 ? trimmed : undefined;
    } else if (rawMusicPath === null) {
      musicPath = undefined;
    } else {
      musicPath = defaultGrammarMistakeInput.musicPath;
    }
  } else {
    musicPath = defaultGrammarMistakeInput.musicPath;
  }

  const merged: GrammarMistakeInput = {
    ...defaultGrammarMistakeInput,
    ...parsed,
    type: isSpotErrorAlias ? 'spot_error' : 'grammar_mistake',
    title: readString(parsed, 'title') || defaultGrammarMistakeInput.title,
    language: readString(parsed, 'language') || undefined,
    hook: readString(parsed, 'hook', true),
    sentence: readString(parsed, 'sentence', true),
    cta: readString(parsed, 'cta', true),
    backgroundVideoPath:
      readString(parsed, 'backgroundVideoPath') ||
      defaultGrammarMistakeInput.backgroundVideoPath,
    musicPath,
    accentColor:
      readString(parsed, 'accentColor') || defaultGrammarMistakeInput.accentColor,
  };

  if (!merged.backgroundVideoPath) {
    throw new Error('Missing required field: backgroundVideoPath');
  }

  merged.backgroundVideoPath = normalizeMediaPath(merged.backgroundVideoPath);
  if (merged.musicPath) {
    merged.musicPath = normalizeMediaPath(merged.musicPath);
  }

  await assertLocalAssetExists(merged.backgroundVideoPath, 'backgroundVideoPath');
  if (merged.musicPath) {
    await assertLocalAssetExists(merged.musicPath, 'musicPath');
  }

  return merged;
};

type CommandResult = {
  stdout: string;
  stderr: string;
};

const runCommand = async (
  command: string,
  args: string[],
): Promise<CommandResult> => {
  return await new Promise<CommandResult>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({stdout, stderr});
        return;
      }

      reject(
        new Error(
          `Command failed: ${command} ${args.join(' ')}\n${stderr || stdout}`,
        ),
      );
    });
  });
};

let sayVoiceCache: Set<string> | null = null;

const getAvailableSayVoices = async (): Promise<Set<string>> => {
  if (sayVoiceCache) {
    return sayVoiceCache;
  }

  const {stdout} = await runCommand('say', ['-v', '?']);
  const voices = new Set<string>();

  for (const line of stdout.split('\n')) {
    const match = line.match(/^(.*?)\s{2,}[a-z]{2}_[A-Z]{2}\s+#/);
    if (match && match[1]) {
      voices.add(match[1].trim());
    }
  }

  sayVoiceCache = voices;
  return voices;
};

const WORD_VOICE_BY_LANGUAGE: Record<string, string[]> = {
  ar: ['Laila', 'Tarik'],
  arabic: ['Laila', 'Tarik'],
  de: ['Eddy (German (Germany))', 'Anna'],
  german: ['Eddy (German (Germany))', 'Anna'],
  en: ['Eddy (English (US))', 'Samantha', 'Alex'],
  english: ['Eddy (English (US))', 'Samantha', 'Alex'],
  es: ['Eddy (Spanish (Spain))', 'Jorge', 'Monica'],
  spanish: ['Eddy (Spanish (Spain))', 'Jorge', 'Monica'],
  fr: ['Eddy (French (France))', 'Thomas', 'Amélie', 'Eddy (French (Canada))'],
  french: ['Eddy (French (France))', 'Thomas', 'Amélie', 'Eddy (French (Canada))'],
  it: ['Eddy (Italian (Italy))', 'Alice'],
  italian: ['Eddy (Italian (Italy))', 'Alice'],
  ja: ['Eddy (Japanese (Japan))', 'Kyoko', 'Otoya'],
  japanese: ['Eddy (Japanese (Japan))', 'Kyoko', 'Otoya'],
  ko: ['Eddy (Korean (South Korea))', 'Yuna'],
  korean: ['Eddy (Korean (South Korea))', 'Yuna'],
  pt: ['Eddy (Portuguese (Brazil))', 'Luciana'],
  portuguese: ['Eddy (Portuguese (Brazil))', 'Luciana'],
  zh: ['Eddy (Chinese (China mainland))', 'Tingting'],
  chinese: ['Eddy (Chinese (China mainland))', 'Tingting'],
};

const ENGLISH_TRANSLATION_VOICE_PREFERENCES = [
  'Eddy (English (US))',
  'Samantha',
  'Alex',
  'Eddy (English (UK))',
  'Daniel',
  'Albert',
];

const pickFirstAvailableVoice = (
  candidates: string[],
  availableVoices: Set<string>,
): string | undefined => {
  return candidates.find((voice) => availableVoices.has(voice));
};

const normalizeLanguageKey = (language?: string): string => {
  return (language ?? '').trim().toLowerCase();
};

const getWordVoiceCandidates = (language?: string): string[] => {
  const key = normalizeLanguageKey(language);
  if (key && WORD_VOICE_BY_LANGUAGE[key]) {
    return WORD_VOICE_BY_LANGUAGE[key];
  }

  return [
    'Eddy (French (France))',
    'Thomas',
    'Amélie',
    'Eddy (English (US))',
  ];
};

const getSafeAudioFileStem = (
  text: string,
  voice: string,
  rate: number,
): string => {
  const digest = createHash('sha1')
    .update(`${voice}|${rate}|${text}`)
    .digest('hex')
    .slice(0, 18);
  return `vocab-${digest}`;
};

const renderTtsClip = async (
  text: string,
  voice: string,
  rate: number,
  outputAbsolutePath: string,
): Promise<void> => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'shorts-tts-'));
  const tempAiffPath = path.join(tempDir, 'speech.aiff');

  try {
    const sayArgs = ['-v', voice, '-r', String(rate), '-o', tempAiffPath, text];
    await runCommand('say', sayArgs);

    const convertArgs = [
      tempAiffPath,
      '-o',
      outputAbsolutePath,
      '-f',
      'm4af',
      '-d',
      'aac',
    ];
    await runCommand('afconvert', convertArgs);
  } finally {
    await rm(tempDir, {recursive: true, force: true});
  }
};

const ensureTtsClip = async (
  text: string,
  voice: string,
  rate: number,
): Promise<string> => {
  const fileStem = getSafeAudioFileStem(text, voice, rate);
  const fileName = `${fileStem}.m4a`;
  const outputAbsolutePath = path.join(ttsCacheDir, fileName);

  try {
    await access(outputAbsolutePath, fsConstants.R_OK);
  } catch {
    await renderTtsClip(text, voice, rate, outputAbsolutePath);
  }

  const relativeToPublic = path.relative(publicDir, outputAbsolutePath);
  return toPosixPath(relativeToPublic);
};

const buildVocabularyVoiceSegments = async (
  words: VocabularyListWord[],
  language?: string,
): Promise<VocabularyVoiceSegment[]> => {
  try {
    await mkdir(ttsCacheDir, {recursive: true});

    const availableVoices = await getAvailableSayVoices();
    const wordVoiceCandidates = getWordVoiceCandidates(language);
    const wordVoice =
      pickFirstAvailableVoice(wordVoiceCandidates, availableVoices) ||
      pickFirstAvailableVoice(ENGLISH_TRANSLATION_VOICE_PREFERENCES, availableVoices) ||
      'Eddy (English (US))';

    const translationVoice =
      pickFirstAvailableVoice(ENGLISH_TRANSLATION_VOICE_PREFERENCES, availableVoices) ||
      wordVoice;

    const fps = VIDEO_CONFIG.fps;
    const introFrames = getVocabularyListIntroFrames(fps);
    const rowDurationFrames = getVocabularyListRowDurationInFrames(fps);

    const wordSpeakFrames = Math.floor(VOCABULARY_LIST_CONFIG.wordSpeakSeconds * fps);
    const betweenFrames = Math.floor(
      VOCABULARY_LIST_CONFIG.betweenWordAndTranslationSeconds * fps,
    );

    const segments: VocabularyVoiceSegment[] = [];

    for (const [index, item] of words.entries()) {
      const rowStart = introFrames + index * rowDurationFrames;
      const translationStart = rowStart + wordSpeakFrames + betweenFrames;

      const wordClipSrc = await ensureTtsClip(item.word, wordVoice, 172);
      const translationClipSrc = await ensureTtsClip(
        item.translation,
        translationVoice,
        182,
      );

      segments.push({
        src: wordClipSrc,
        startFrame: rowStart,
        volume: 1,
      });

      segments.push({
        src: translationClipSrc,
        startFrame: translationStart,
        volume: 0.95,
      });
    }

    return segments;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      'TTS generation failed for vocabulary_list. This template needs macOS commands `say` and `afconvert`.\n' +
        message,
    );
  }
};

const parseVocabularyListInput = async (
  parsed: Record<string, unknown>,
): Promise<VocabularyListInput> => {
  const rawWords = parsed.words;

  if (!Array.isArray(rawWords) || rawWords.length === 0) {
    throw new Error('Missing required field: words (non-empty array)');
  }

  const words: VocabularyListWord[] = rawWords.map((entry, index) => {
    const obj = asRecord(entry);
    if (!obj) {
      throw new Error(`Word entry at index ${index} must be an object.`);
    }

    const word = readString(obj, 'word', true);
    const translation = readString(obj, 'translation', true);

    return {word, translation};
  });

  const normalizedBackground = readString(parsed, 'background').toLowerCase();
  const background: 'carou1' | 'carou2' =
    normalizedBackground === 'carou2' ? 'carou2' : 'carou1';

  const rawBackgroundImagePath = readString(parsed, 'backgroundImagePath');
  const defaultBackgroundImagePath =
    background === 'carou2' ? 'backgrounds/carou2.jpg' : 'backgrounds/carou1.jpg';

  const backgroundImagePath = normalizeMediaPath(
    rawBackgroundImagePath || defaultBackgroundImagePath,
  );

  await assertLocalAssetExists(backgroundImagePath, 'backgroundImagePath');

  let resolvedBackground: 'carou1' | 'carou2' = background;
  const backgroundLower = backgroundImagePath.toLowerCase();
  if (backgroundLower.includes('carou2')) {
    resolvedBackground = 'carou2';
  }
  if (backgroundLower.includes('carou1')) {
    resolvedBackground = 'carou1';
  }

  const language = readString(parsed, 'language') || undefined;
  const voiceSegments = await buildVocabularyVoiceSegments(words, language);

  return {
    type: 'vocabulary_list',
    title: readString(parsed, 'title', true),
    difficulty: readString(parsed, 'difficulty') || undefined,
    language,
    words,
    cta: readString(parsed, 'cta') || undefined,
    background: resolvedBackground,
    backgroundImagePath,
    voiceSegments,
  };
};

type RenderSelection = {
  compositionId:
    | 'PromoVideo'
    | 'Quiz2ChoicesVideo'
    | 'GrammarMistakeVideo'
    | 'VocabularyListVideo';
  inputProps: AnyVideoInput;
};

const parseRenderSelection = async (jsonPath: string): Promise<RenderSelection> => {
  const raw = await readFile(jsonPath, 'utf-8');
  const parsedJson = parseInputJson(raw);
  const root = pickRootObject(parsedJson);
  const forcedTemplate = parseTemplateChoice(templateArg);

  if (forcedTemplate === 'promo') {
    return {
      compositionId: 'PromoVideo',
      inputProps: await parsePromoInput(root),
    };
  }

  if (forcedTemplate === 'quiz_2_choices') {
    return {
      compositionId: 'Quiz2ChoicesVideo',
      inputProps: parseQuizInput(root),
    };
  }

  if (forcedTemplate === 'grammar_mistake' || forcedTemplate === 'spot_error') {
    return {
      compositionId: 'GrammarMistakeVideo',
      inputProps: await parseGrammarMistakeInput(root),
    };
  }

  if (forcedTemplate === 'vocabulary_list') {
    return {
      compositionId: 'VocabularyListVideo',
      inputProps: await parseVocabularyListInput(root),
    };
  }

  if (root.type === 'quiz_2_choices') {
    return {
      compositionId: 'Quiz2ChoicesVideo',
      inputProps: parseQuizInput(root),
    };
  }

  if (readString(root, 'type') === 'vocabulary_list') {
    return {
      compositionId: 'VocabularyListVideo',
      inputProps: await parseVocabularyListInput(root),
    };
  }

  const typeValue = readString(root, 'type');
  const titleValue = readString(root, 'title');
  const isGrammarMistake =
    typeValue === 'grammar_mistake' ||
    typeValue === 'spot_error' ||
    titleValue === 'spot_error';

  if (isGrammarMistake) {
    return {
      compositionId: 'GrammarMistakeVideo',
      inputProps: await parseGrammarMistakeInput(root),
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
