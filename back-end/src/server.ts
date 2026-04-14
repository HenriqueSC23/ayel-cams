import cors from 'cors';
import express from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import {
  changeOwnUserPassword,
  countAdministrators,
  createCamera,
  createUserByAdmin,
  findUserByEmail,
  findUserById,
  findCameraById,
  listCameras,
  listUsers,
  removeCameraByAdmin,
  removeUserByAdmin,
  registerUser,
  touchUserAccess,
  updateCameraByAdmin,
  updateOwnUserProfile,
  updateUserByAdmin,
} from './data/store.js';
import { initializeDatabase } from './db/bootstrap.js';
import { query as dbQuery } from './db/client.js';
import { revokeTokenId } from './lib/token-revocation-store.js';
import { verifyPassword } from './lib/password-hash.js';
import { signStreamPlayToken, verifyStreamPlayToken } from './lib/stream-token.js';
import {
  activateStreamPlaySession,
  completeStreamPlaySession,
  countActiveStreamSessionsForUserCamera,
  createStreamPlaySession,
  findStreamPlaySessionByTokenId,
  touchStreamPlaySession,
} from './lib/stream-session-store.js';
import { validateStreamSourceUrl } from './lib/stream-url-security.js';
import { optionalAuth, requireAdmin, requireAuth } from './middleware/auth-middleware.js';
import { signAuthToken } from './lib/auth-token.js';
import type { AuthSafeUser, AuthUser, CameraRecord } from './types/domain-types.js';

function normalizeValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function hasBodyField(body: unknown, field: string) {
  return typeof body === 'object' && body !== null && Object.prototype.hasOwnProperty.call(body, field);
}

function parseCameraAccess(value: unknown): 'public' | 'restricted' | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = normalizeValue(value);
  if (['public', 'publica', 'publicas'].includes(normalized)) {
    return 'public';
  }

  if (['restricted', 'restrita', 'restritas'].includes(normalized)) {
    return 'restricted';
  }

  return null;
}

function parseCameraStatus(value: unknown): 'live' | 'offline' | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = normalizeValue(value);
  if (['live', 'ao vivo', 'aovivo'].includes(normalized)) {
    return 'live';
  }

  if (normalized === 'offline') {
    return 'offline';
  }

  return null;
}

function parseQuality(value: unknown): 'HD' | 'FHD' | '4K' | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === 'HD' || normalized === 'FHD' || normalized === '4K') {
    return normalized as 'HD' | 'FHD' | '4K';
  }

  return null;
}

function parseRole(value: unknown): 'administrador' | 'cliente' | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = normalizeValue(value);
  if (['administrador', 'admin'].includes(normalized)) {
    return 'administrador';
  }

  if (['cliente', 'user', 'usuario'].includes(normalized)) {
    return 'cliente';
  }

  return null;
}

function parseUserStatus(value: unknown): 'Ativo' | 'Inativo' | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = normalizeValue(value);
  if (normalized === 'ativo') {
    return 'Ativo';
  }

  if (normalized === 'inativo') {
    return 'Inativo';
  }

  return null;
}

function parseUserAccess(value: unknown): 'Administrador' | 'Area restrita' | 'Sem acesso' | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = normalizeValue(value);
  if (['administrador', 'admin'].includes(normalized)) {
    return 'Administrador';
  }

  if (['area restrita', 'restrito', 'restrita'].includes(normalized)) {
    return 'Area restrita';
  }

  if (['sem acesso', 'bloqueado', 'sem permissao'].includes(normalized)) {
    return 'Sem acesso';
  }

  return null;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }

  return null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toSafeUserPayload(user: AuthSafeUser | AuthUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profile: user.profile,
    access: user.access,
    status: user.status,
    unit: user.unit,
    avatar: user.avatar,
    lastAccess: user.lastAccess,
    phone: user.phone,
    company: user.company,
    jobTitle: user.jobTitle,
    preferences: user.preferences,
  };
}

type CameraCatalogItem = Omit<CameraRecord, 'streamUrl'> & {
  hasStream: boolean;
};

type StreamPlaybackType = 'hls' | 'image' | 'iframe';

interface StreamPlaybackSource {
  playbackType: StreamPlaybackType;
  playbackUrl: string;
  posterUrl?: string;
}

interface CachedPublicStreamResolution {
  expiresAtMs: number;
  sourceUrl: string;
  value: StreamPlaybackSource;
}

interface RestreamerPlayerConfig {
  poster?: string;
  source?: string;
}

function toCameraCatalogItem(camera: CameraRecord): CameraCatalogItem {
  return {
    id: camera.id,
    name: camera.name,
    location: camera.location,
    unit: camera.unit,
    category: camera.category,
    access: camera.access,
    status: camera.status,
    quality: camera.quality,
    image: camera.image,
    description: camera.description,
    updatedAt: camera.updatedAt,
    hasStream: camera.streamUrl.trim().length > 0,
  };
}

function isHtmlStreamUrl(streamUrl: string) {
  const value = streamUrl.trim();
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    const pathname = parsed.pathname.toLowerCase();
    return pathname.endsWith('.html') || pathname.endsWith('.htm');
  } catch {
    return false;
  }
}

function getPlaybackUrl(req: Request, path: string) {
  return `${getStreamGatewayPublicBaseUrl(req)}${path}`;
}

function applyForwardedQueryParams(sourceUrl: string, query: Request['query']) {
  const targetUrl = new URL(sourceUrl);

  for (const [key, rawValue] of Object.entries(query)) {
    if (typeof rawValue === 'string') {
      targetUrl.searchParams.set(key, rawValue);
      continue;
    }

    if (Array.isArray(rawValue)) {
      targetUrl.searchParams.delete(key);
      rawValue.forEach((value) => {
        if (typeof value === 'string') {
          targetUrl.searchParams.append(key, value);
        }
      });
    }
  }

  return targetUrl.toString();
}

function isImageStreamUrl(streamUrl: string) {
  return /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(streamUrl.trim());
}

function isHlsStreamUrl(streamUrl: string) {
  return /\.m3u8(\?.*)?$/i.test(streamUrl.trim());
}

function toStreamPlaybackSource(streamUrl: string, posterUrl?: string): StreamPlaybackSource {
  const normalizedStreamUrl = streamUrl.trim();
  if (isHlsStreamUrl(normalizedStreamUrl)) {
    return {
      playbackType: 'hls',
      playbackUrl: normalizedStreamUrl,
      posterUrl,
    };
  }

  if (isImageStreamUrl(normalizedStreamUrl)) {
    return {
      playbackType: 'image',
      playbackUrl: normalizedStreamUrl,
      posterUrl,
    };
  }

  return {
    playbackType: 'iframe',
    playbackUrl: normalizedStreamUrl,
    posterUrl,
  };
}

function buildAbsolutePublicAssetUrl(origin: string, rawPath: string) {
  if (!rawPath.trim()) {
    return '';
  }

  return new URL(rawPath.startsWith('/') ? rawPath : `/${rawPath}`, `${origin}/`).toString();
}

function parseRestreamerPlayerConfig(scriptContent: string) {
  const firstBraceIndex = scriptContent.indexOf('{');
  const lastBraceIndex = scriptContent.lastIndexOf('}');

  if (firstBraceIndex === -1 || lastBraceIndex === -1 || lastBraceIndex <= firstBraceIndex) {
    throw new Error('Config de stream publica invalida.');
  }

  const jsonContent = scriptContent.slice(firstBraceIndex, lastBraceIndex + 1);
  return JSON.parse(jsonContent) as RestreamerPlayerConfig;
}

const publicStreamResolutionCache = new Map<string, CachedPublicStreamResolution>();
const publicStreamResolutionTtlMs = 60_000;

async function resolvePublicStreamSource(camera: CameraRecord): Promise<StreamPlaybackSource> {
  const sourceUrl = camera.streamUrl.trim();
  const cacheKey = `${camera.id}:${sourceUrl}`;
  const now = Date.now();
  const cachedValue = publicStreamResolutionCache.get(cacheKey);

  if (cachedValue && cachedValue.sourceUrl === sourceUrl && cachedValue.expiresAtMs > now) {
    return cachedValue.value;
  }

  const fallbackSource = toStreamPlaybackSource(sourceUrl);

  if (!isHtmlStreamUrl(sourceUrl)) {
    publicStreamResolutionCache.set(cacheKey, {
      expiresAtMs: now + publicStreamResolutionTtlMs,
      sourceUrl,
      value: fallbackSource,
    });
    return fallbackSource;
  }

  try {
    const parsedStreamUrl = new URL(sourceUrl);
    const fileName = parsedStreamUrl.pathname.split('/').pop() || '';
    const channelId = fileName.replace(/\.html?$/i, '').trim();

    if (!channelId) {
      throw new Error('Canal publico invalido.');
    }

    const configUrl = new URL(`/channels/${channelId}/config.js`, parsedStreamUrl.origin).toString();
    const configResponse = await fetch(configUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        Accept: 'application/javascript,text/javascript,*/*',
      },
    });

    if (!configResponse.ok) {
      throw new Error('Config publica indisponivel.');
    }

    const configContent = await configResponse.text();
    const playerConfig = parseRestreamerPlayerConfig(configContent);
    const resolvedPlaybackUrl = typeof playerConfig.source === 'string' ? buildAbsolutePublicAssetUrl(parsedStreamUrl.origin, playerConfig.source) : '';
    const resolvedPosterUrl = typeof playerConfig.poster === 'string' ? buildAbsolutePublicAssetUrl(parsedStreamUrl.origin, playerConfig.poster) : undefined;

    const resolvedSource = resolvedPlaybackUrl ? toStreamPlaybackSource(resolvedPlaybackUrl, resolvedPosterUrl) : fallbackSource;
    publicStreamResolutionCache.set(cacheKey, {
      expiresAtMs: now + publicStreamResolutionTtlMs,
      sourceUrl,
      value: resolvedSource,
    });

    return resolvedSource;
  } catch {
    publicStreamResolutionCache.set(cacheKey, {
      expiresAtMs: now + publicStreamResolutionTtlMs,
      sourceUrl,
      value: fallbackSource,
    });
    return fallbackSource;
  }
}

interface LoginAttemptEntry {
  failedCount: number;
  firstFailureAt: number;
  blockedUntil: number;
}

const loginAttempts = new Map<string, LoginAttemptEntry>();
const loginMaxFailures = Number(process.env.LOGIN_MAX_FAILURES || 5);
const loginWindowMs = Number(process.env.LOGIN_WINDOW_MS || 10 * 60 * 1000);
const loginBlockMs = Number(process.env.LOGIN_BLOCK_MS || 15 * 60 * 1000);
const defaultDevelopmentCorsOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const streamSessionAttempts = new Map<string, number[]>();
const streamSessionWindowMs = Number(process.env.STREAM_SESSION_RATE_LIMIT_WINDOW_MS || 60 * 1000);
const streamSessionRateLimit = Number(process.env.STREAM_SESSION_RATE_LIMIT || 12);
const streamMaxConcurrentPerUserCamera = Number(process.env.STREAM_MAX_CONCURRENT_PER_USER_CAMERA || 2);
const streamInternalApiKey = process.env.STREAM_INTERNAL_API_KEY?.trim() || '';

function getLoginAttemptKey(ip: string, email: string) {
  return `${ip}|${email}`;
}

function getLoginBlockRemainingSeconds(key: string, now: number) {
  const entry = loginAttempts.get(key);
  if (!entry || entry.blockedUntil <= now) {
    return 0;
  }

  return Math.max(1, Math.ceil((entry.blockedUntil - now) / 1000));
}

function clearLoginFailures(key: string) {
  loginAttempts.delete(key);
}

function registerLoginFailure(key: string, now: number) {
  const current = loginAttempts.get(key);

  if (!current || now - current.firstFailureAt > loginWindowMs) {
    const nextEntry: LoginAttemptEntry = {
      failedCount: 1,
      firstFailureAt: now,
      blockedUntil: 0,
    };
    loginAttempts.set(key, nextEntry);
    return nextEntry;
  }

  const nextFailedCount = current.failedCount + 1;
  const shouldBlock = nextFailedCount >= loginMaxFailures;

  const nextEntry: LoginAttemptEntry = {
    failedCount: nextFailedCount,
    firstFailureAt: current.firstFailureAt,
    blockedUntil: shouldBlock ? now + loginBlockMs : current.blockedUntil,
  };

  loginAttempts.set(key, nextEntry);
  return nextEntry;
}

function withAsyncHandler(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const logLevelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLogLevel = (process.env.LOG_LEVEL || 'info').trim().toLowerCase() as LogLevel;
const minimumLogLevel: LogLevel = configuredLogLevel in logLevelPriority ? configuredLogLevel : 'info';

function shouldLog(level: LogLevel) {
  return logLevelPriority[level] >= logLevelPriority[minimumLogLevel];
}

function writeLog(level: LogLevel, event: string, context: Record<string, unknown>) {
  if (!shouldLog(level)) {
    return;
  }

  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    service: 'ayel-cams-api',
    ...context,
  });

  if (level === 'error') {
    console.error(payload);
    return;
  }

  if (level === 'warn') {
    console.warn(payload);
    return;
  }

  console.log(payload);
}

function logDebug(event: string, context: Record<string, unknown> = {}) {
  writeLog('debug', event, context);
}

function logInfo(event: string, context: Record<string, unknown> = {}) {
  writeLog('info', event, context);
}

function logWarn(event: string, context: Record<string, unknown> = {}) {
  writeLog('warn', event, context);
}

function logError(event: string, context: Record<string, unknown> = {}) {
  writeLog('error', event, context);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'erro desconhecido';
}

class HttpStatusError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const app = express();
const port = Number(process.env.PORT || 3333);
const serviceName = 'ayel-cams-api';
const serviceVersion = process.env.npm_package_version || '1.0.0';
let databaseReadyPromise: Promise<void> | null = null;

function ensureDatabaseReady() {
  if (!databaseReadyPromise) {
    databaseReadyPromise = initializeDatabase().catch((error) => {
      databaseReadyPromise = null;
      throw error;
    });
  }

  return databaseReadyPromise;
}

function sanitizeLoggedPath(rawPath: string) {
  const [pathWithoutQuery, queryString] = rawPath.split('?');
  const redactedPath = pathWithoutQuery.replace(/\/streams\/play\/[^/]+/g, '/streams/play/[redacted]');

  if (!queryString) {
    return redactedPath;
  }

  const params = new URLSearchParams(queryString);
  ['token', 'auth', 'connkey', 'signature', 'sig'].forEach((key) => {
    if (params.has(key)) {
      params.set(key, '[redacted]');
    }
  });

  return `${redactedPath}?${params.toString()}`;
}

function getStreamFingerprint(req: Request) {
  const source = [req.ip || 'n/a', req.header('user-agent') || 'n/a'].join('|');
  return createHash('sha256').update(source).digest('hex');
}

function consumeStreamSessionRateLimit(userId: string, cameraId: string) {
  const key = `${userId}:${cameraId}`;
  const now = Date.now();
  const previous = streamSessionAttempts.get(key) || [];
  const next = previous.filter((timestamp) => now - timestamp <= streamSessionWindowMs);

  if (next.length >= streamSessionRateLimit) {
    streamSessionAttempts.set(key, next);
    return false;
  }

  next.push(now);
  streamSessionAttempts.set(key, next);
  return true;
}

function getStreamGatewayPublicBaseUrl(req: Request) {
  const configuredBaseUrl = process.env.STREAM_GATEWAY_PUBLIC_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  const host = req.get('host') || `localhost:${port}`;
  const protocol = req.protocol || 'http';
  return `${protocol}://${host}`;
}

function isAllowedDevelopmentOrigin(origin: string) {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  try {
    const parsedOrigin = new URL(origin);
    const allowedHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
    return allowedHosts.has(parsedOrigin.hostname);
  } catch {
    return false;
  }
}

const corsOrigin = (() => {
  const configuredOrigins = process.env.CORS_ORIGIN
    ?.split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (configuredOrigins && configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('CORS_ORIGIN obrigatorio em producao. Informe uma lista explicita de origens.');
  }

  return defaultDevelopmentCorsOrigins;
})();

function resolveRequestLogLevel(statusCode: number) {
  if (statusCode >= 500) {
    return 'error';
  }

  if (statusCode >= 400) {
    return 'warn';
  }

  return 'info';
}

app.use(
  cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      if (corsOrigin.includes(requestOrigin) || isAllowedDevelopmentOrigin(requestOrigin)) {
        callback(null, true);
        return;
      }

      callback(new HttpStatusError(403, 'Origem nao permitida por CORS.'));
    },
  }),
);
app.use((req, res, next) => {
  const receivedRequestId = req.header('x-request-id');
  const requestId = typeof receivedRequestId === 'string' && receivedRequestId.trim().length > 0 ? receivedRequestId.trim() : randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const startedAt = process.hrtime.bigint();
  logDebug('request.started', {
    requestId,
    method: req.method,
    path: sanitizeLoggedPath(req.originalUrl),
    ip: req.ip,
  });

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const payload = {
      requestId,
      method: req.method,
      path: sanitizeLoggedPath(req.originalUrl),
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };

    const level = resolveRequestLogLevel(res.statusCode);
    if (level === 'error') {
      logError('request.completed', payload);
      return;
    }

    if (level === 'warn') {
      logWarn('request.completed', payload);
      return;
    }

    logInfo('request.completed', payload);
  });

  next();
});

app.get('/health/live', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: serviceName,
    version: serviceVersion,
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString(),
  });
});

app.get(
  '/health/ready',
  withAsyncHandler(async (_req, res) => {
    try {
      await dbQuery('SELECT 1');
      res.status(200).json({
        status: 'ok',
        service: serviceName,
        version: serviceVersion,
        checks: {
          database: 'up',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    } catch (error) {
      logWarn('health.ready.failed', { message: getErrorMessage(error) });
      res.status(503).json({
        status: 'degraded',
        service: serviceName,
        version: serviceVersion,
        checks: {
          database: 'down',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }),
);

app.get(
  '/health',
  withAsyncHandler(async (_req, res) => {
    try {
      await dbQuery('SELECT 1');
      res.status(200).json({
        status: 'ok',
        service: serviceName,
        version: serviceVersion,
        checks: {
          database: 'up',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    } catch (error) {
      logWarn('health.failed', { message: getErrorMessage(error) });
      res.status(503).json({
        status: 'degraded',
        service: serviceName,
        version: serviceVersion,
        checks: {
          database: 'down',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }),
);

app.use(express.json());
app.use((req, res, next) => {
  void ensureDatabaseReady()
    .then(() => next())
    .catch((error) => {
      next(error);
    });
});

app.post(
  '/auth/login',
  withAsyncHandler(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const now = Date.now();
  const loginKey = getLoginAttemptKey(req.ip || 'unknown-ip', email || 'unknown-email');
  const retryAfter = getLoginBlockRemainingSeconds(loginKey, now);

  if (retryAfter > 0) {
    res.status(429).json({
      message: `Muitas tentativas de login. Aguarde ${retryAfter}s para tentar novamente.`,
    });
    return;
  }

  if (!email || !password) {
    res.status(422).json({ message: 'E-mail e senha sao obrigatorios.' });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(422).json({ message: 'E-mail invalido.' });
    return;
  }

  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    const attempt = registerLoginFailure(loginKey, now);
    if (attempt.blockedUntil > now) {
      const retryAfterSeconds = Math.max(1, Math.ceil((attempt.blockedUntil - now) / 1000));
      res.status(429).json({ message: `Muitas tentativas de login. Aguarde ${retryAfterSeconds}s para tentar novamente.` });
      return;
    }

    res.status(401).json({ message: 'Credenciais invalidas.' });
    return;
  }

  clearLoginFailures(loginKey);

  if (user.status !== 'Ativo') {
    res.status(403).json({ message: 'Usuario inativo. Contate o administrador.' });
    return;
  }

  await touchUserAccess(user.id);

  const token = signAuthToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(200).json({
    token,
    user: toSafeUserPayload(user),
  });
  }),
);

app.post(
  '/auth/register',
  withAsyncHandler(async (req, res) => {
  const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!fullName || !email || !password) {
    res.status(422).json({ message: 'Nome, e-mail e senha sao obrigatorios.' });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(422).json({ message: 'E-mail invalido.' });
    return;
  }

  if (password.length < 6) {
    res.status(422).json({ message: 'A senha deve conter no minimo 6 caracteres.' });
    return;
  }

  if (await findUserByEmail(email)) {
    res.status(409).json({ message: 'Ja existe um usuario com este e-mail.' });
    return;
  }

  const user = await registerUser({ fullName, email, password, role: 'cliente' });
  const token = signAuthToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    token,
    user: toSafeUserPayload(user),
  });
  }),
);

app.get(
  '/auth/me',
  requireAuth,
  withAsyncHandler(async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Autenticacao obrigatoria.' });
    return;
  }

  const user = await findUserById(userId);
  if (!user) {
    res.status(401).json({ message: 'Sessao invalida.' });
    return;
  }

  res.status(200).json({
    ...toSafeUserPayload(user),
  });
  }),
);

app.post(
  '/auth/logout',
  requireAuth,
  withAsyncHandler(async (req, res) => {
    const tokenId = req.auth?.tokenId;
    const tokenExp = req.auth?.tokenExp;

    if (!tokenId || typeof tokenExp !== 'number') {
      res.status(401).json({ message: 'Sessao invalida.' });
      return;
    }

    await revokeTokenId(tokenId, tokenExp);
    res.status(204).send();
  }),
);

app.get(
  '/profile/me',
  requireAuth,
  withAsyncHandler(async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Autenticacao obrigatoria.' });
    return;
  }

  const user = await findUserById(userId);
  if (!user) {
    res.status(401).json({ message: 'Sessao invalida.' });
    return;
  }

  res.status(200).json({
    item: toSafeUserPayload(user),
  });
  }),
);

app.patch(
  '/profile/me',
  requireAuth,
  withAsyncHandler(async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Autenticacao obrigatoria.' });
    return;
  }

  const currentUser = await findUserById(userId);
  if (!currentUser) {
    res.status(401).json({ message: 'Sessao invalida.' });
    return;
  }

  const updatePayload: {
    fullName?: string;
    email?: string;
    unit?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    preferences?: {
      notifyAlerts?: boolean;
      prioritizeFavorites?: boolean;
      rememberLastView?: boolean;
      preferGridView?: boolean;
    };
  } = {};

  if (hasBodyField(req.body, 'fullName')) {
    const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
    if (!fullName) {
      res.status(422).json({ message: 'Nome completo invalido.' });
      return;
    }
    updatePayload.fullName = fullName;
  }

  if (hasBodyField(req.body, 'email')) {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || !isValidEmail(email)) {
      res.status(422).json({ message: 'E-mail invalido.' });
      return;
    }

    const existingUserWithEmail = await findUserByEmail(email);
    if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
      res.status(409).json({ message: 'Ja existe um usuario com este e-mail.' });
      return;
    }

    updatePayload.email = email;
  }

  if (hasBodyField(req.body, 'phone')) {
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    updatePayload.phone = phone;
  }

  if (hasBodyField(req.body, 'company')) {
    const company = typeof req.body?.company === 'string' ? req.body.company.trim() : '';
    if (!company) {
      res.status(422).json({ message: 'Empresa invalida.' });
      return;
    }
    updatePayload.company = company;
  }

  if (hasBodyField(req.body, 'jobTitle')) {
    const jobTitle = typeof req.body?.jobTitle === 'string' ? req.body.jobTitle.trim() : '';
    if (!jobTitle) {
      res.status(422).json({ message: 'Cargo invalido.' });
      return;
    }
    updatePayload.jobTitle = jobTitle;
  }

  if (hasBodyField(req.body, 'unit')) {
    const unit = typeof req.body?.unit === 'string' ? req.body.unit.trim() : '';
    if (!unit) {
      res.status(422).json({ message: 'Unidade invalida.' });
      return;
    }
    updatePayload.unit = unit;
  }

  if (hasBodyField(req.body, 'preferences')) {
    if (typeof req.body?.preferences !== 'object' || req.body.preferences === null) {
      res.status(422).json({ message: 'Preferencias invalidas.' });
      return;
    }

    const nextPreferences: {
      notifyAlerts?: boolean;
      prioritizeFavorites?: boolean;
      rememberLastView?: boolean;
      preferGridView?: boolean;
    } = {};

    if (hasBodyField(req.body.preferences, 'notifyAlerts')) {
      const parsedValue = parseBoolean(req.body.preferences.notifyAlerts);
      if (parsedValue === null) {
        res.status(422).json({ message: 'Preferencia notifyAlerts invalida.' });
        return;
      }
      nextPreferences.notifyAlerts = parsedValue;
    }

    if (hasBodyField(req.body.preferences, 'prioritizeFavorites')) {
      const parsedValue = parseBoolean(req.body.preferences.prioritizeFavorites);
      if (parsedValue === null) {
        res.status(422).json({ message: 'Preferencia prioritizeFavorites invalida.' });
        return;
      }
      nextPreferences.prioritizeFavorites = parsedValue;
    }

    if (hasBodyField(req.body.preferences, 'rememberLastView')) {
      const parsedValue = parseBoolean(req.body.preferences.rememberLastView);
      if (parsedValue === null) {
        res.status(422).json({ message: 'Preferencia rememberLastView invalida.' });
        return;
      }
      nextPreferences.rememberLastView = parsedValue;
    }

    if (hasBodyField(req.body.preferences, 'preferGridView')) {
      const parsedValue = parseBoolean(req.body.preferences.preferGridView);
      if (parsedValue === null) {
        res.status(422).json({ message: 'Preferencia preferGridView invalida.' });
        return;
      }
      nextPreferences.preferGridView = parsedValue;
    }

    if (Object.keys(nextPreferences).length > 0) {
      updatePayload.preferences = nextPreferences;
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    res.status(422).json({ message: 'Nenhum campo valido foi enviado para atualizar o perfil.' });
    return;
  }

  const updatedUser = await updateOwnUserProfile(userId, updatePayload);
  if (!updatedUser) {
    res.status(404).json({ message: 'Usuario nao encontrado.' });
    return;
  }

  res.status(200).json({ item: toSafeUserPayload(updatedUser) });
  }),
);

app.patch(
  '/profile/me/password',
  requireAuth,
  withAsyncHandler(async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Autenticacao obrigatoria.' });
    return;
  }

  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

  if (!currentPassword || !newPassword) {
    res.status(422).json({ message: 'Senha atual e nova senha sao obrigatorias.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(422).json({ message: 'A nova senha deve conter no minimo 6 caracteres.' });
    return;
  }

  if (currentPassword === newPassword) {
    res.status(422).json({ message: 'A nova senha precisa ser diferente da senha atual.' });
    return;
  }

  const result = await changeOwnUserPassword(userId, currentPassword, newPassword);
  if (!result.ok) {
    if (result.reason === 'invalid-current-password') {
      res.status(422).json({ message: 'Senha atual invalida.' });
      return;
    }

    res.status(404).json({ message: 'Usuario nao encontrado.' });
    return;
  }

  res.status(204).send();
  }),
);

app.get(
  '/cameras',
  optionalAuth,
  withAsyncHandler(async (req, res) => {
  const access = typeof req.query.access === 'string' ? normalizeValue(req.query.access) : '';
  const status = parseCameraStatus(req.query.status);
  const search = typeof req.query.search === 'string' ? normalizeValue(req.query.search) : '';

  const canViewRestricted = req.auth?.role === 'administrador' || req.auth?.role === 'cliente';
  let cameras = await listCameras();

  if (!canViewRestricted) {
    cameras = cameras.filter((camera) => camera.access === 'public');
  }

  if (access === 'restricted' || access === 'restritas') {
    if (!canViewRestricted) {
      res.status(403).json({ message: 'Acesso negado para cameras restritas.' });
      return;
    }

    cameras = cameras.filter((camera) => camera.access === 'restricted');
  } else if (access === 'public' || access === 'publicas') {
    cameras = cameras.filter((camera) => camera.access === 'public');
  }

  if (status) {
    cameras = cameras.filter((camera) => camera.status === status);
  }

  if (search) {
    cameras = cameras.filter((camera) => {
      const value = normalizeValue([camera.name, camera.location, camera.unit, camera.category, camera.description].join(' '));
      return value.includes(search);
    });
  }

  res.status(200).json({ items: cameras.map(toCameraCatalogItem) });
  }),
);

app.post(
  '/cameras',
  requireAuth,
  requireAdmin,
  withAsyncHandler(async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
  const category = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
  const unit = typeof req.body?.unit === 'string' && req.body.unit.trim().length > 0 ? req.body.unit.trim() : 'Matriz';
  const image = typeof req.body?.image === 'string' ? req.body.image.trim() : '';
  const streamUrl = typeof req.body?.streamUrl === 'string' ? req.body.streamUrl.trim() : '';
  const access = parseCameraAccess(req.body?.access);
  const status = parseCameraStatus(req.body?.status);
  const quality = parseQuality(req.body?.quality);

  if (!name || !location || !category || !access || !status || !quality) {
    res.status(422).json({
      message: 'Nome, local, categoria, acesso, status e qualidade sao obrigatorios para cadastrar camera.',
    });
    return;
  }

  const streamValidation = validateStreamSourceUrl(streamUrl);
  if (!streamValidation.ok) {
    res.status(422).json({ message: streamValidation.message || 'URL de stream invalida.' });
    return;
  }

  const createdCamera = await createCamera({
    name,
    location,
    category,
    description,
    access,
    status,
    quality,
    unit,
    image: image || undefined,
    streamUrl: streamUrl || undefined,
  });

  res.status(201).json({ item: toCameraCatalogItem(createdCamera) });
  }),
);

app.patch(
  '/cameras/:cameraId',
  requireAuth,
  requireAdmin,
  withAsyncHandler(async (req, res) => {
  const cameraId = typeof req.params.cameraId === 'string' ? req.params.cameraId.trim() : '';
  if (!cameraId) {
    res.status(422).json({ message: 'Identificador da camera e obrigatorio.' });
    return;
  }

  const currentCamera = await findCameraById(cameraId);
  if (!currentCamera) {
    res.status(404).json({ message: 'Camera nao encontrada.' });
    return;
  }

  const updatePayload: {
    name?: string;
    location?: string;
    unit?: string;
    category?: string;
    access?: 'public' | 'restricted';
    status?: 'live' | 'offline';
    quality?: 'HD' | 'FHD' | '4K';
    description?: string;
    image?: string;
    streamUrl?: string;
  } = {};

  if (hasBodyField(req.body, 'name')) {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name) {
      res.status(422).json({ message: 'Nome da camera invalido.' });
      return;
    }
    updatePayload.name = name;
  }

  if (hasBodyField(req.body, 'location')) {
    const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
    if (!location) {
      res.status(422).json({ message: 'Local da camera invalido.' });
      return;
    }
    updatePayload.location = location;
  }

  if (hasBodyField(req.body, 'unit')) {
    const unit = typeof req.body?.unit === 'string' ? req.body.unit.trim() : '';
    if (!unit) {
      res.status(422).json({ message: 'Unidade da camera invalida.' });
      return;
    }
    updatePayload.unit = unit;
  }

  if (hasBodyField(req.body, 'category')) {
    const category = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
    if (!category) {
      res.status(422).json({ message: 'Categoria da camera invalida.' });
      return;
    }
    updatePayload.category = category;
  }

  if (hasBodyField(req.body, 'description')) {
    if (typeof req.body?.description !== 'string') {
      res.status(422).json({ message: 'Descricao da camera invalida.' });
      return;
    }
    updatePayload.description = req.body.description.trim();
  }

  if (hasBodyField(req.body, 'image')) {
    if (typeof req.body?.image !== 'string') {
      res.status(422).json({ message: 'Imagem da camera invalida.' });
      return;
    }
    updatePayload.image = req.body.image.trim();
  }

  if (hasBodyField(req.body, 'streamUrl')) {
    if (typeof req.body?.streamUrl !== 'string') {
      res.status(422).json({ message: 'URL de stream invalida.' });
      return;
    }
    const streamUrl = req.body.streamUrl.trim();
    const streamValidation = validateStreamSourceUrl(streamUrl);
    if (!streamValidation.ok) {
      res.status(422).json({ message: streamValidation.message || 'URL de stream invalida.' });
      return;
    }

    updatePayload.streamUrl = streamUrl;
  }

  if (hasBodyField(req.body, 'access')) {
    const parsedAccess = parseCameraAccess(req.body?.access);
    if (!parsedAccess) {
      res.status(422).json({ message: 'Acesso da camera invalido.' });
      return;
    }
    updatePayload.access = parsedAccess;
  }

  if (hasBodyField(req.body, 'status')) {
    const parsedStatus = parseCameraStatus(req.body?.status);
    if (!parsedStatus) {
      res.status(422).json({ message: 'Status da camera invalido.' });
      return;
    }
    updatePayload.status = parsedStatus;
  }

  if (hasBodyField(req.body, 'quality')) {
    const parsedQuality = parseQuality(req.body?.quality);
    if (!parsedQuality) {
      res.status(422).json({ message: 'Qualidade da camera invalida.' });
      return;
    }
    updatePayload.quality = parsedQuality;
  }

  if (Object.keys(updatePayload).length === 0) {
    res.status(422).json({ message: 'Nenhum campo valido foi enviado para atualizar a camera.' });
    return;
  }

  const updatedCamera = await updateCameraByAdmin(cameraId, updatePayload);
  if (!updatedCamera) {
    res.status(404).json({ message: 'Camera nao encontrada.' });
    return;
  }

  res.status(200).json({ item: toCameraCatalogItem(updatedCamera) });
  }),
);

app.delete(
  '/cameras/:cameraId',
  requireAuth,
  requireAdmin,
  withAsyncHandler(async (req, res) => {
  const cameraId = typeof req.params.cameraId === 'string' ? req.params.cameraId.trim() : '';
  if (!cameraId) {
    res.status(422).json({ message: 'Identificador da camera e obrigatorio.' });
    return;
  }

  const deleted = await removeCameraByAdmin(cameraId);
  if (!deleted) {
    res.status(404).json({ message: 'Camera nao encontrada.' });
    return;
  }

  res.status(204).send();
  }),
);

app.post(
  '/streams/sessions',
  optionalAuth,
  withAsyncHandler(async (req, res) => {
    const userId = req.auth?.userId;
    const role = req.auth?.role;
    const cameraId = typeof req.body?.cameraId === 'string' ? req.body.cameraId.trim() : '';

    if (!cameraId) {
      res.status(422).json({ message: 'cameraId e obrigatorio.' });
      return;
    }

    const camera = await findCameraById(cameraId);
    if (!camera) {
      res.status(404).json({ message: 'Camera nao encontrada.' });
      return;
    }

    if (camera.access === 'restricted' && role !== 'administrador' && role !== 'cliente') {
      res.status(403).json({ message: 'Permissao insuficiente para visualizar esta camera.' });
      return;
    }

    const hasStream = camera.streamUrl.trim().length > 0;
    if (!hasStream || camera.status !== 'live') {
      res.status(422).json({ message: 'Camera indisponivel para transmissao ao vivo.' });
      return;
    }

    if (camera.access === 'public') {
      const publicPlaybackSource = await resolvePublicStreamSource(camera);
      res.status(201).json({
        playbackType: publicPlaybackSource.playbackType,
        playbackUrl: publicPlaybackSource.playbackUrl,
        posterUrl: publicPlaybackSource.posterUrl,
        expiresAt: new Date(Date.now() + publicStreamResolutionTtlMs).toISOString(),
      });
      return;
    }

    if (!userId || !role) {
      res.status(401).json({ message: 'Autenticacao obrigatoria.' });
      return;
    }

    if (!consumeStreamSessionRateLimit(userId, cameraId)) {
      res.status(429).json({ message: 'Limite de solicitacoes de stream excedido. Tente novamente em instantes.' });
      return;
    }

    const activeSessions = await countActiveStreamSessionsForUserCamera(userId, cameraId);
    if (activeSessions >= streamMaxConcurrentPerUserCamera) {
      res.status(429).json({ message: 'Limite de sessoes simultaneas para esta camera foi atingido.' });
      return;
    }

    const tokenPayload = signStreamPlayToken({
      userId,
      role,
      cameraId,
    });

    await createStreamPlaySession({
      tokenId: tokenPayload.tokenId,
      userId,
      cameraId,
      role,
      expiresAt: tokenPayload.expiresAt,
    });

    const protectedPlaybackType = isHtmlStreamUrl(camera.streamUrl) ? 'iframe' : 'image';
    const playbackPath = protectedPlaybackType === 'iframe' ? 'embed' : 'play';
    const playbackUrl = getPlaybackUrl(req, `/streams/${playbackPath}/${tokenPayload.token}`);
    res.status(201).json({
      playbackUrl,
      playbackType: protectedPlaybackType,
      posterUrl: camera.image,
      expiresAt: tokenPayload.expiresAt.toISOString(),
    });
  }),
);

app.get(
  '/streams/public-embed/:cameraId',
  withAsyncHandler(async (req, res) => {
    const cameraId = typeof req.params.cameraId === 'string' ? req.params.cameraId.trim() : '';
    if (!cameraId) {
      res.status(422).json({ message: 'cameraId e obrigatorio.' });
      return;
    }

    const camera = await findCameraById(cameraId);
    if (!camera || camera.access !== 'public') {
      res.status(404).json({ message: 'Camera nao encontrada.' });
      return;
    }

    if (camera.status !== 'live' || camera.streamUrl.trim().length === 0) {
      res.status(410).json({ message: 'Transmissao indisponivel no momento.' });
      return;
    }

    res.redirect(302, applyForwardedQueryParams(camera.streamUrl, req.query));
  }),
);

app.get(
  '/streams/public-play/:cameraId',
  withAsyncHandler(async (req, res) => {
    const cameraId = typeof req.params.cameraId === 'string' ? req.params.cameraId.trim() : '';
    if (!cameraId) {
      res.status(422).json({ message: 'cameraId e obrigatorio.' });
      return;
    }

    const camera = await findCameraById(cameraId);
    if (!camera || camera.access !== 'public') {
      res.status(404).json({ message: 'Camera nao encontrada.' });
      return;
    }

    if (camera.status !== 'live' || camera.streamUrl.trim().length === 0) {
      res.status(410).json({ message: 'Transmissao indisponivel no momento.' });
      return;
    }

    const upstreamResponse = await fetch(camera.streamUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      res.status(502).json({ message: 'Nao foi possivel iniciar a transmissao da camera.' });
      return;
    }

    const upstreamContentType = upstreamResponse.headers.get('content-type') || 'application/octet-stream';
    const upstreamContentLength = upstreamResponse.headers.get('content-length');

    res.status(200);
    res.setHeader('Content-Type', upstreamContentType);
    if (upstreamContentLength) {
      res.setHeader('Content-Length', upstreamContentLength);
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    await pipeline(Readable.fromWeb(upstreamResponse.body as never), res);
  }),
);

app.get(
  '/streams/embed/:playToken',
  withAsyncHandler(async (req, res) => {
    const playToken = typeof req.params.playToken === 'string' ? req.params.playToken.trim() : '';
    if (!playToken) {
      res.status(401).json({ message: 'Token de stream invalido.' });
      return;
    }

    let streamPayload;
    try {
      streamPayload = verifyStreamPlayToken(playToken);
    } catch {
      res.status(401).json({ message: 'Token de stream invalido ou expirado.' });
      return;
    }

    const session = await findStreamPlaySessionByTokenId(streamPayload.jti);
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      res.status(401).json({ message: 'Sessao de stream expirada ou invalida.' });
      return;
    }

    if (session.userId !== streamPayload.sub || session.cameraId !== streamPayload.cameraId || session.role !== streamPayload.role) {
      res.status(401).json({ message: 'Sessao de stream invalida.' });
      return;
    }

    const fingerprintHash = getStreamFingerprint(req);
    if (session.fingerprintHash && session.fingerprintHash !== fingerprintHash) {
      await completeStreamPlaySession(streamPayload.jti);
      res.status(403).json({ message: 'Token de stream ja utilizado por outro cliente.' });
      return;
    }

    const activated = await activateStreamPlaySession(streamPayload.jti, fingerprintHash);
    if (!activated) {
      res.status(403).json({ message: 'Token de stream ja utilizado.' });
      return;
    }

    const camera = await findCameraById(streamPayload.cameraId);
    if (!camera || camera.status !== 'live' || camera.streamUrl.trim().length === 0) {
      await completeStreamPlaySession(streamPayload.jti);
      res.status(410).json({ message: 'Transmissao indisponivel no momento.' });
      return;
    }

    await completeStreamPlaySession(streamPayload.jti);
    res.redirect(302, applyForwardedQueryParams(camera.streamUrl, req.query));
  }),
);

app.get(
  '/internal/streams/source/:cameraId',
  withAsyncHandler(async (req, res) => {
    if (!streamInternalApiKey) {
      res.status(404).json({ message: 'Rota nao encontrada.' });
      return;
    }

    const providedInternalKey = req.header('x-stream-internal-key')?.trim() || '';
    if (!providedInternalKey || providedInternalKey !== streamInternalApiKey) {
      res.status(401).json({ message: 'Acesso interno nao autorizado.' });
      return;
    }

    const cameraId = typeof req.params.cameraId === 'string' ? req.params.cameraId.trim() : '';
    if (!cameraId) {
      res.status(422).json({ message: 'cameraId e obrigatorio.' });
      return;
    }

    const camera = await findCameraById(cameraId);
    if (!camera) {
      res.status(404).json({ message: 'Camera nao encontrada.' });
      return;
    }

    if (!camera.streamUrl.trim()) {
      res.status(404).json({ message: 'Camera sem stream configurado.' });
      return;
    }

    res.status(200).json({
      cameraId: camera.id,
      sourceUrl: camera.streamUrl,
    });
  }),
);

app.get(
  '/streams/play/:playToken',
  withAsyncHandler(async (req, res) => {
    const playToken = typeof req.params.playToken === 'string' ? req.params.playToken.trim() : '';
    if (!playToken) {
      res.status(401).json({ message: 'Token de stream invalido.' });
      return;
    }

    let streamPayload;
    try {
      streamPayload = verifyStreamPlayToken(playToken);
    } catch {
      res.status(401).json({ message: 'Token de stream invalido ou expirado.' });
      return;
    }

    const session = await findStreamPlaySessionByTokenId(streamPayload.jti);
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      res.status(401).json({ message: 'Sessao de stream expirada ou invalida.' });
      return;
    }

    if (session.userId !== streamPayload.sub || session.cameraId !== streamPayload.cameraId || session.role !== streamPayload.role) {
      res.status(401).json({ message: 'Sessao de stream invalida.' });
      return;
    }

    const fingerprintHash = getStreamFingerprint(req);
    if (session.fingerprintHash && session.fingerprintHash !== fingerprintHash) {
      await completeStreamPlaySession(streamPayload.jti);
      res.status(403).json({ message: 'Token de stream ja utilizado por outro cliente.' });
      return;
    }

    const activated = await activateStreamPlaySession(streamPayload.jti, fingerprintHash);
    if (!activated) {
      res.status(403).json({ message: 'Token de stream ja utilizado.' });
      return;
    }

    const camera = await findCameraById(streamPayload.cameraId);
    if (!camera || camera.status !== 'live' || camera.streamUrl.trim().length === 0) {
      await completeStreamPlaySession(streamPayload.jti);
      res.status(410).json({ message: 'Transmissao indisponivel no momento.' });
      return;
    }

    const controller = new AbortController();
    const handleClientClose = () => {
      controller.abort();
    };

    req.once('close', handleClientClose);

    try {
      const upstreamResponse = await fetch(camera.streamUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      });

      if (!upstreamResponse.ok || !upstreamResponse.body) {
        await completeStreamPlaySession(streamPayload.jti);
        res.status(502).json({ message: 'Nao foi possivel iniciar a transmissao da camera.' });
        return;
      }

      const upstreamContentType = upstreamResponse.headers.get('content-type') || 'application/octet-stream';
      const upstreamContentLength = upstreamResponse.headers.get('content-length');

      res.status(200);
      res.setHeader('Content-Type', upstreamContentType);
      if (upstreamContentLength) {
        res.setHeader('Content-Length', upstreamContentLength);
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      await touchStreamPlaySession(streamPayload.jti);
      await pipeline(Readable.fromWeb(upstreamResponse.body as never), res);
      await completeStreamPlaySession(streamPayload.jti);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        logWarn('stream.proxy.failed', {
          requestId: req.requestId ?? 'n/a',
          cameraId: streamPayload.cameraId,
          message: getErrorMessage(error),
        });

        if (!res.headersSent) {
          res.status(502).json({ message: 'Erro ao retransmitir stream da camera.' });
        }
      }

      await completeStreamPlaySession(streamPayload.jti);
    } finally {
      req.off('close', handleClientClose);
    }
  }),
);

app.get(
  '/users',
  requireAuth,
  requireAdmin,
  withAsyncHandler(async (_req, res) => {
    res.status(200).json({ items: await listUsers() });
  }),
);

app.post(
  '/users',
  requireAuth,
  requireAdmin,
  withAsyncHandler(async (req, res) => {
  const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const parsedRole = parseRole(req.body?.role ?? req.body?.profile);
  const parsedStatus = parseUserStatus(req.body?.status);
  const parsedAccess = parseUserAccess(req.body?.access);
  const unit = typeof req.body?.unit === 'string' && req.body.unit.trim().length > 0 ? req.body.unit.trim() : 'Matriz';

  if (!fullName || !email || !password || !parsedRole || !parsedStatus) {
    res.status(422).json({
      message: 'Nome, e-mail, senha, perfil e status sao obrigatorios para cadastrar usuario.',
    });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(422).json({ message: 'E-mail invalido.' });
    return;
  }

  if (password.length < 6) {
    res.status(422).json({ message: 'A senha deve conter no minimo 6 caracteres.' });
    return;
  }

  if (await findUserByEmail(email)) {
    res.status(409).json({ message: 'Ja existe um usuario com este e-mail.' });
    return;
  }

  const defaultAccess = parsedRole === 'administrador' ? 'Administrador' : 'Area restrita';

  const createdUser = await createUserByAdmin({
    fullName,
    email,
    password,
    role: parsedRole,
    status: parsedStatus,
    access: parsedAccess ?? defaultAccess,
    unit,
  });

  res.status(201).json({ item: createdUser });
  }),
);

app.patch(
  '/users/:userId',
  requireAuth,
  requireAdmin,
  withAsyncHandler(async (req, res) => {
  const userId = typeof req.params.userId === 'string' ? req.params.userId.trim() : '';
  if (!userId) {
    res.status(422).json({ message: 'Identificador do usuario e obrigatorio.' });
    return;
  }

  const currentUser = await findUserById(userId);
  if (!currentUser) {
    res.status(404).json({ message: 'Usuario nao encontrado.' });
    return;
  }

  const updatePayload: {
    fullName?: string;
    email?: string;
    password?: string;
    role?: 'administrador' | 'cliente';
    status?: 'Ativo' | 'Inativo';
    access?: 'Administrador' | 'Area restrita' | 'Sem acesso';
    unit?: string;
  } = {};

  if (hasBodyField(req.body, 'fullName')) {
    const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
    if (!fullName) {
      res.status(422).json({ message: 'Nome completo invalido.' });
      return;
    }
    updatePayload.fullName = fullName;
  }

  if (hasBodyField(req.body, 'email')) {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || !email.includes('@')) {
      res.status(422).json({ message: 'E-mail invalido.' });
      return;
    }

    const existingUserWithEmail = await findUserByEmail(email);
    if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
      res.status(409).json({ message: 'Ja existe um usuario com este e-mail.' });
      return;
    }

    updatePayload.email = email;
  }

  if (hasBodyField(req.body, 'password')) {
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!password || password.length < 6) {
      res.status(422).json({ message: 'A senha deve conter no minimo 6 caracteres.' });
      return;
    }
    updatePayload.password = password;
  }

  const roleFieldSent = hasBodyField(req.body, 'role') || hasBodyField(req.body, 'profile');
  if (roleFieldSent) {
    const parsedRole = parseRole(req.body?.role ?? req.body?.profile);
    if (!parsedRole) {
      res.status(422).json({ message: 'Perfil de usuario invalido.' });
      return;
    }
    updatePayload.role = parsedRole;
  }

  if (hasBodyField(req.body, 'status')) {
    const parsedStatus = parseUserStatus(req.body?.status);
    if (!parsedStatus) {
      res.status(422).json({ message: 'Status do usuario invalido.' });
      return;
    }
    updatePayload.status = parsedStatus;
  }

  if (hasBodyField(req.body, 'access')) {
    const parsedAccess = parseUserAccess(req.body?.access);
    if (!parsedAccess) {
      res.status(422).json({ message: 'Nivel de acesso invalido.' });
      return;
    }
    updatePayload.access = parsedAccess;
  }

  if (hasBodyField(req.body, 'unit')) {
    const unit = typeof req.body?.unit === 'string' ? req.body.unit.trim() : '';
    if (!unit) {
      res.status(422).json({ message: 'Unidade do usuario invalida.' });
      return;
    }
    updatePayload.unit = unit;
  }

  const isLastAdministrator = currentUser.role === 'administrador' && (await countAdministrators()) <= 1;
  if (isLastAdministrator) {
    const willLoseAdminRole = updatePayload.role === 'cliente';
    const willBeInactive = updatePayload.status === 'Inativo';
    const willLoseAdminAccess = updatePayload.access === 'Sem acesso';

    if (willLoseAdminRole || willBeInactive || willLoseAdminAccess) {
      res.status(422).json({ message: 'A plataforma precisa manter pelo menos um administrador ativo.' });
      return;
    }
  }

  if (updatePayload.role === 'administrador' && !updatePayload.access) {
    updatePayload.access = 'Administrador';
  }

  if (updatePayload.role === 'cliente') {
    if (updatePayload.access === 'Administrador') {
      res.status(422).json({ message: 'Usuario cliente nao pode receber acesso de administrador.' });
      return;
    }

    if (!updatePayload.access && currentUser.access === 'Administrador') {
      updatePayload.access = 'Area restrita';
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    res.status(422).json({ message: 'Nenhum campo valido foi enviado para atualizar o usuario.' });
    return;
  }

  const updatedUser = await updateUserByAdmin(userId, updatePayload);
  if (!updatedUser) {
    res.status(404).json({ message: 'Usuario nao encontrado.' });
    return;
  }

  res.status(200).json({ item: updatedUser });
  }),
);

app.delete(
  '/users/:userId',
  requireAuth,
  requireAdmin,
  withAsyncHandler(async (req, res) => {
  const userId = typeof req.params.userId === 'string' ? req.params.userId.trim() : '';
  if (!userId) {
    res.status(422).json({ message: 'Identificador do usuario e obrigatorio.' });
    return;
  }

  const currentUser = await findUserById(userId);
  if (!currentUser) {
    res.status(404).json({ message: 'Usuario nao encontrado.' });
    return;
  }

  if (req.auth?.userId === userId) {
    res.status(422).json({ message: 'Nao e permitido remover o proprio usuario administrador.' });
    return;
  }

  if (currentUser.role === 'administrador' && (await countAdministrators()) <= 1) {
    res.status(422).json({ message: 'A plataforma precisa manter pelo menos um administrador ativo.' });
    return;
  }

  const deleted = await removeUserByAdmin(userId);
  if (!deleted) {
    res.status(404).json({ message: 'Usuario nao encontrado.' });
    return;
  }

  res.status(204).send();
  }),
);

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = error instanceof HttpStatusError ? error.statusCode : 500;
  const responseMessage = statusCode >= 500 ? 'Erro interno ao processar a requisicao.' : getErrorMessage(error);

  const logContext = {
    requestId: req.requestId ?? 'n/a',
    method: req.method,
    path: sanitizeLoggedPath(req.originalUrl),
    statusCode,
    message: getErrorMessage(error),
  };

  if (statusCode >= 500) {
    logError('request.unhandled_error', logContext);
  } else {
    logWarn('request.handled_error', logContext);
  }

  if (res.headersSent) {
    return;
  }

  res.status(statusCode).json({ message: responseMessage });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Rota nao encontrada.' });
});

export { app };

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  void ensureDatabaseReady()
    .then(() => {
      app.listen(port, () => {
        logInfo('server.started', {
          service: serviceName,
          version: serviceVersion,
          port,
          url: `http://localhost:${port}`,
        });
      });
    })
    .catch((error) => {
      logError('server.start_failed', {
        service: serviceName,
        version: serviceVersion,
        message: getErrorMessage(error),
      });
      process.exit(1);
    });
}
