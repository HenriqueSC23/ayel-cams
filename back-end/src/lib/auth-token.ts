import jwt from 'jsonwebtoken';
import { randomBytes, randomUUID } from 'node:crypto';
import type { AuthRole } from '../types/domain-types.js';

interface SignAuthTokenPayload {
  sub: string;
  email: string;
  role: AuthRole;
}

export interface AuthTokenPayload extends SignAuthTokenPayload {
  jti: string;
  iat: number;
  exp: number;
}

const TOKEN_TTL = '8h';
const generatedDevelopmentSecret = randomBytes(48).toString('hex');

function getSecret() {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET obrigatorio em producao.');
  }

  return generatedDevelopmentSecret;
}

export function signAuthToken(payload: SignAuthTokenPayload) {
  return jwt.sign(payload, getSecret(), {
    expiresIn: TOKEN_TTL,
    jwtid: randomUUID(),
  });
}

export function verifyAuthToken(token: string) {
  const verifiedValue = jwt.verify(token, getSecret());
  if (!verifiedValue || typeof verifiedValue !== 'object') {
    throw new Error('Token invalido.');
  }

  const payload = verifiedValue as Partial<AuthTokenPayload>;

  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string' || typeof payload.role !== 'string') {
    throw new Error('Payload de token invalido.');
  }

  if (typeof payload.jti !== 'string' || typeof payload.iat !== 'number' || typeof payload.exp !== 'number') {
    throw new Error('Metadados de token invalidos.');
  }

  return payload as AuthTokenPayload;
}
