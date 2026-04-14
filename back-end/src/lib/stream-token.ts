import jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { AuthRole } from '../types/domain-types.js';

interface SignStreamTokenInput {
  userId: string;
  role: AuthRole;
  cameraId: string;
}

export interface StreamTokenPayload {
  sub: string;
  role: AuthRole;
  cameraId: string;
  jti: string;
  iat: number;
  exp: number;
}

const defaultStreamTokenTtlSeconds = 120;
const generatedDevelopmentSecret = randomBytes(48).toString('hex');

function getStreamTokenSecret() {
  const configuredSecret = process.env.STREAM_PLAY_TOKEN_SECRET?.trim();
  if (configuredSecret) {
    return configuredSecret;
  }

  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (jwtSecret) {
    return createHash('sha256').update(jwtSecret).update(':stream-play').digest('hex');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('STREAM_PLAY_TOKEN_SECRET obrigatorio em producao.');
  }

  return generatedDevelopmentSecret;
}

function getStreamTokenTtlSeconds() {
  const parsed = Number(process.env.STREAM_PLAY_TOKEN_TTL_SECONDS || defaultStreamTokenTtlSeconds);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultStreamTokenTtlSeconds;
  }

  return Math.floor(parsed);
}

export function signStreamPlayToken(input: SignStreamTokenInput) {
  const ttlSeconds = getStreamTokenTtlSeconds();
  const tokenId = randomUUID();
  const token = jwt.sign(
    {
      sub: input.userId,
      role: input.role,
      cameraId: input.cameraId,
    },
    getStreamTokenSecret(),
    {
      expiresIn: ttlSeconds,
      jwtid: tokenId,
    },
  );

  return {
    token,
    tokenId,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000),
  };
}

export function verifyStreamPlayToken(token: string) {
  const verified = jwt.verify(token, getStreamTokenSecret());
  if (!verified || typeof verified !== 'object') {
    throw new Error('Token de stream invalido.');
  }

  const payload = verified as Partial<StreamTokenPayload>;
  if (
    typeof payload.sub !== 'string' ||
    typeof payload.role !== 'string' ||
    typeof payload.cameraId !== 'string' ||
    typeof payload.jti !== 'string' ||
    typeof payload.exp !== 'number' ||
    typeof payload.iat !== 'number'
  ) {
    throw new Error('Payload de token de stream invalido.');
  }

  return payload as StreamTokenPayload;
}
