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

const sendJson = (
  res: ServerResponse,
  statusCode: number,
  payload: Record<string, unknown>,
): void => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const safeBasename = (fileName: string): string => {
  const base = path.basename(fileName || 'input');
  const withoutExt = base.replace(/\.[^.]+$/, '');

  return withoutExt
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'input';
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
): Promise<string> => {
  return await new Promise<string>((resolve, reject) => {
    const args = ['scripts/render.ts', inputRelativePath, outputRelativePath];
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

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    sendJson(res, 400, {error: 'Body must be a JSON object.'});
    return;
  }

  const payload = body as {jsonText?: unknown; fileName?: unknown};

  if (typeof payload.jsonText !== 'string' || payload.jsonText.trim().length === 0) {
    sendJson(res, 400, {error: 'Missing jsonText string in request body.'});
    return;
  }

  const rawJsonText = payload.jsonText.trim();
  const sourceName =
    typeof payload.fileName === 'string' && payload.fileName.length > 0
      ? payload.fileName
      : 'input.json';

  const now = new Date();
  const stamp = `${now
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .replace('Z', '')}-${Math.floor(Math.random() * 10000)}`;

  const jsonName = `${safeBasename(sourceName)}-${stamp}.json`;
  const videoName = `render-${stamp}.mp4`;

  const inputAbsolutePath = path.join(uploadsDir, jsonName);
  const outputAbsolutePath = path.join(outDir, videoName);

  const inputRelativePath = path.relative(projectRoot, inputAbsolutePath);
  const outputRelativePath = path.relative(projectRoot, outputAbsolutePath);

  await mkdir(uploadsDir, {recursive: true});
  await mkdir(outDir, {recursive: true});
  await writeFile(inputAbsolutePath, rawJsonText, 'utf-8');

  renderInProgress = true;

  try {
    const logs = await runRender(inputRelativePath, outputRelativePath);

    sendJson(res, 200, {
      ok: true,
      videoUrl: `/renders/${videoName}`,
      outputPath: outputAbsolutePath,
      logs,
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
