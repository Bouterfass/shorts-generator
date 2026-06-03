import {spawn} from 'node:child_process';
import {createServer, IncomingMessage, ServerResponse} from 'node:http';
import {createReadStream} from 'node:fs';
import {mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const uiPath = path.join(projectRoot, 'scripts', 'dropzone-ui.html');
const uploadsDir = path.join(projectRoot, 'data', 'uploads');
const outDir = path.join(projectRoot, 'out');
const tsxBinary = path.join(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
);
const port = Number(process.env.PORT ?? 4321);

let renderInProgress = false;

type TemplateChoice =
  | 'auto'
  | 'promo'
  | 'quiz_2_choices'
  | 'grammar_mistake'
  | 'spot_error'
  | 'vocabulary_list';

type RenderJob = {
  templateType: TemplateChoice;
  inputObject: Record<string, unknown>;
  index: number;
  outputNameBase?: string;
};

type RenderResult = {
  index: number;
  templateType: TemplateChoice;
  videoUrl: string;
  outputPath: string;
  fileName: string;
  logs: string;
};

type OutputNameConfig = {
  baseName: string;
  custom: boolean;
};

const parseTemplateChoice = (value: unknown): TemplateChoice => {
  if (typeof value !== 'string') {
    return 'auto';
  }

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

const guessTemplateFromObject = (obj: Record<string, unknown>): TemplateChoice => {
  const typeValue = parseTemplateChoice(obj.type);
  if (typeValue !== 'auto') {
    return typeValue;
  }

  const titleValue =
    typeof obj.title === 'string' ? obj.title.trim().toLowerCase() : '';

  if (titleValue === 'spot_error') {
    return 'spot_error';
  }

  return 'auto';
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const parseInputJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    const maybeConcatenated = raw.trim().replace(/}\s*{/g, '},{');
    try {
      return JSON.parse(`[${maybeConcatenated}]`) as unknown;
    } catch {
      throw new Error(
        'Invalid JSON input. Provide a valid JSON object, array, or a batch object with a videos array.',
      );
    }
  }
};

const forceTemplateTypeOnObject = (
  inputObject: Record<string, unknown>,
  templateType: TemplateChoice,
): Record<string, unknown> => {
  if (templateType === 'auto') {
    return inputObject;
  }

  if (templateType === 'promo') {
    return {...inputObject, type: 'promo'};
  }

  if (templateType === 'quiz_2_choices') {
    return {...inputObject, type: 'quiz_2_choices'};
  }

  if (templateType === 'grammar_mistake') {
    return {...inputObject, type: 'grammar_mistake'};
  }

  if (templateType === 'vocabulary_list') {
    return {...inputObject, type: 'vocabulary_list'};
  }

  return {...inputObject, type: 'spot_error'};
};

const readBatchDefaultTemplate = (root: Record<string, unknown>): TemplateChoice => {
  const byDefaultTemplate = parseTemplateChoice(root.defaultTemplate);
  if (byDefaultTemplate !== 'auto') {
    return byDefaultTemplate;
  }

  const byBatchTemplate = parseTemplateChoice(root.batchTemplate);
  if (byBatchTemplate !== 'auto') {
    return byBatchTemplate;
  }

  return 'auto';
};

const extractJobsFromParsedJson = (
  parsed: unknown,
  requestedTemplateType: TemplateChoice,
): RenderJob[] => {
  const buildJob = (
    rawEntry: unknown,
    index: number,
    inheritedTemplateType: TemplateChoice,
  ): RenderJob => {
    if (!isRecord(rawEntry)) {
      throw new Error(`Invalid entry at index ${index}. Each video entry must be an object.`);
    }

    const payload = isRecord(rawEntry.data) ? rawEntry.data : rawEntry;
    if (!isRecord(payload)) {
      throw new Error(`Invalid entry at index ${index}. "data" must be an object.`);
    }

    const entryTemplate = parseTemplateChoice(rawEntry.template);
    const payloadTemplate = guessTemplateFromObject(payload);

    const resolvedTemplateType =
      requestedTemplateType !== 'auto'
        ? requestedTemplateType
        : entryTemplate !== 'auto'
          ? entryTemplate
          : payloadTemplate !== 'auto'
            ? payloadTemplate
            : inheritedTemplateType;

    const entryOutputNameConfig = parseOutputNameConfig(
      getMaybeValue(rawEntry, ['outputName', 'name']) ??
        getMaybeValue(payload, ['outputName', 'name']),
    );

    return {
      index,
      templateType: resolvedTemplateType,
      inputObject: forceTemplateTypeOnObject(payload, resolvedTemplateType),
      outputNameBase: entryOutputNameConfig.custom
        ? entryOutputNameConfig.baseName
        : slugify(deriveVideoTitle(payload, resolvedTemplateType)),
    };
  };

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error('JSON array is empty. Add at least one video object.');
    }

    return parsed.map((entry, index) => buildJob(entry, index, 'auto'));
  }

  if (!isRecord(parsed)) {
    throw new Error('Input must be a JSON object, an array, or a batch object.');
  }

  const maybeVideos = parsed.videos;
  if (Array.isArray(maybeVideos)) {
    if (maybeVideos.length === 0) {
      throw new Error('"videos" is empty. Add at least one video object.');
    }

    const batchDefaultTemplate = readBatchDefaultTemplate(parsed);

    return maybeVideos.map((entry, index) =>
      buildJob(entry, index, batchDefaultTemplate),
    );
  }

  return [buildJob(parsed, 0, 'auto')];
};

const sendJson = (
  res: ServerResponse,
  statusCode: number,
  payload: Record<string, unknown>,
): void => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const slugify = (value: string): string => {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 54) || 'video'
  );
};

const safeBasename = (fileName: string): string => {
  const base = path.basename(fileName || 'input');
  const withoutExt = base.replace(/\.[^.]+$/, '');

  return slugify(withoutExt);
};

const deriveVideoTitle = (
  payload: Record<string, unknown>,
  templateType: TemplateChoice,
): string => {
  const title = getMaybeValue(payload, ['title']);
  if (typeof title === 'string' && title.trim()) {
    return title;
  }

  if (templateType === 'promo') {
    const hookText = getMaybeValue(payload, ['hookText']);
    if (typeof hookText === 'string' && hookText.trim()) {
      return hookText;
    }
  }

  if (templateType === 'spot_error' || templateType === 'grammar_mistake') {
    const sentence = getMaybeValue(payload, ['sentence']);
    if (typeof sentence === 'string' && sentence.trim()) {
      return sentence;
    }
  }

  const cta = getMaybeValue(payload, ['cta', 'ctaText']);
  if (typeof cta === 'string' && cta.trim()) {
    return cta;
  }

  return 'video';
};

const parseOutputNameConfig = (value: unknown): OutputNameConfig => {
  if (typeof value !== 'string') {
    return {baseName: 'render', custom: false};
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return {baseName: 'render', custom: false};
  }

  const normalizedBase = safeBasename(trimmed);
  return {
    baseName: normalizedBase || 'render',
    custom: true,
  };
};

const getMaybeValue = (
  obj: Record<string, unknown>,
  keys: string[],
): unknown => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return obj[key];
    }
  }

  return undefined;
};

const readRequestBody = async (req: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];
  let totalLength = 0;
  const maxBodySize = 2 * 1024 * 1024;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalLength += buffer.length;

    if (totalLength > maxBodySize) {
      throw new Error('Request body is too large (max 2MB).');
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString('utf-8');
};

const runRender = async (
  inputRelativePath: string,
  outputRelativePath: string,
  templateChoice: TemplateChoice,
): Promise<string> => {
  return await new Promise<string>((resolve, reject) => {
    const args = [
      'scripts/render.ts',
      inputRelativePath,
      outputRelativePath,
      templateChoice,
    ];
    const child = spawn(tsxBinary, args, {
      cwd: projectRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let logs = '';

    child.stdout.on('data', (chunk) => {
      logs += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      logs += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(logs.trim());
        return;
      }

      reject(new Error(`Render failed with code ${String(code)}\n${logs}`));
    });
  });
};

const renderJob = async (
  sourceName: string,
  stamp: string,
  job: RenderJob,
  outputNameConfig: OutputNameConfig,
  usedVideoNames: Set<string>,
): Promise<RenderResult> => {
  const idx = String(job.index + 1).padStart(2, '0');
  const jsonName = `${safeBasename(sourceName)}-${stamp}-${idx}.json`;
  const baseName =
    outputNameConfig.custom && outputNameConfig.baseName
      ? outputNameConfig.baseName
      : job.outputNameBase || `video-${idx}`;

  let videoName = `${baseName}.mp4`;
  if (usedVideoNames.has(videoName)) {
    videoName = `${baseName}-${idx}.mp4`;
  }
  usedVideoNames.add(videoName);

  const inputAbsolutePath = path.join(uploadsDir, jsonName);
  const outputAbsolutePath = path.join(outDir, videoName);

  const inputRelativePath = path.relative(projectRoot, inputAbsolutePath);
  const outputRelativePath = path.relative(projectRoot, outputAbsolutePath);

  await writeFile(inputAbsolutePath, JSON.stringify(job.inputObject, null, 2), 'utf-8');

  const logs = await runRender(
    inputRelativePath,
    outputRelativePath,
    job.templateType,
  );

  return {
    index: job.index,
    templateType: job.templateType,
    videoUrl: `/renders/${videoName}`,
    outputPath: outputAbsolutePath,
    fileName: videoName,
    logs,
  };
};

const handleRender = async (req: IncomingMessage, res: ServerResponse) => {
  if (renderInProgress) {
    sendJson(res, 409, {
      error: 'A render is already running. Please wait for it to finish.',
    });
    return;
  }

  const bodyText = await readRequestBody(req);
  let body: unknown;

  try {
    body = JSON.parse(bodyText);
  } catch {
    sendJson(res, 400, {error: 'Invalid request JSON body.'});
    return;
  }

  if (!isRecord(body)) {
    sendJson(res, 400, {error: 'Body must be a JSON object.'});
    return;
  }

  const payload = body as {
    jsonText?: unknown;
    fileName?: unknown;
    templateType?: unknown;
    outputName?: unknown;
    name?: unknown;
  };

  if (typeof payload.jsonText !== 'string' || payload.jsonText.trim().length === 0) {
    sendJson(res, 400, {error: 'Missing jsonText string in request body.'});
    return;
  }

  const rawJsonText = payload.jsonText.trim();
  const requestedTemplateType = parseTemplateChoice(payload.templateType);
  const outputNameConfig = parseOutputNameConfig(payload.outputName ?? payload.name);
  const sourceName =
    typeof payload.fileName === 'string' && payload.fileName.length > 0
      ? payload.fileName
      : 'input.json';

  let jobs: RenderJob[] = [];

  try {
    const parsedInput = parseInputJson(rawJsonText);
    jobs = extractJobsFromParsedJson(parsedInput, requestedTemplateType);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(res, 400, {error: message});
    return;
  }

  const now = new Date();
  const stamp = `${now
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .replace('Z', '')}-${Math.floor(Math.random() * 10000)}`;

  await mkdir(uploadsDir, {recursive: true});
  await mkdir(outDir, {recursive: true});

  renderInProgress = true;

  try {
    const videos: RenderResult[] = [];
    const usedVideoNames = new Set<string>();

    for (const job of jobs) {
      const result = await renderJob(
        sourceName,
        stamp,
        job,
        outputNameConfig,
        usedVideoNames,
      );
      videos.push(result);
    }

    sendJson(res, 200, {
      ok: true,
      count: videos.length,
      templateTypeRequested: requestedTemplateType,
      outputNameBase: outputNameConfig.baseName,
      videos,
      // Compatibility with existing front logic
      videoUrl: videos[0]?.videoUrl ?? null,
      outputPath: videos[0]?.outputPath ?? null,
      logs: videos.map((v) => `#${v.index + 1} [${v.templateType}]\n${v.logs}`).join('\n\n'),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(res, 500, {error: message});
  } finally {
    renderInProgress = false;
  }
};

const serveVideo = async (reqPath: string, res: ServerResponse) => {
  const fileName = path.basename(reqPath.replace('/renders/', ''));
  const filePath = path.join(outDir, fileName);

  try {
    await stat(filePath);
  } catch {
    res.statusCode = 404;
    res.end('Video not found');
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Cache-Control', 'no-store');

  createReadStream(filePath).pipe(res);
};

const server = createServer(async (req, res) => {
  const method = req.method ?? 'GET';
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);
  const reqPath = url.pathname;

  try {
    if (method === 'GET' && reqPath === '/') {
      const html = await readFile(uiPath, 'utf-8');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(html);
      return;
    }

    if (method === 'GET' && reqPath.startsWith('/renders/')) {
      await serveVideo(reqPath, res);
      return;
    }

    if (method === 'POST' && reqPath === '/api/render') {
      await handleRender(req, res);
      return;
    }

    if (method === 'GET' && reqPath === '/api/status') {
      sendJson(res, 200, {
        ok: true,
        rendering: renderInProgress,
      });
      return;
    }

    res.statusCode = 404;
    res.end('Not found');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(res, 500, {error: message});
  }
});

server.listen(port, () => {
  console.log(`Dropzone server running on http://localhost:${port}`);
  console.log('Drop a JSON file in the browser UI to render automatically.');
});
