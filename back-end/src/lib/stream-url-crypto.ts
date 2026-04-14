import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export interface EncryptedStreamSecret {
  encrypted: string;
  iv: string;
  authTag: string;
  keyVersion: number;
}

const streamEncryptionAlgorithm = 'aes-256-gcm';
const streamEncryptionKeyVersion = 1;

function getStreamEncryptionKey() {
  const configuredKey = process.env.STREAM_URL_ENCRYPTION_KEY?.trim();
  if (configuredKey) {
    const decoded = Buffer.from(configuredKey, 'base64');
    if (decoded.length !== 32) {
      throw new Error('STREAM_URL_ENCRYPTION_KEY deve ser uma chave base64 de 32 bytes.');
    }
    return decoded;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('STREAM_URL_ENCRYPTION_KEY obrigatoria em producao.');
  }

  return createHash('sha256').update('ayel-cams-dev-stream-url-key').digest();
}

export function encryptStreamUrl(streamUrl: string): EncryptedStreamSecret {
  const value = streamUrl.trim();
  if (!value) {
    return {
      encrypted: '',
      iv: '',
      authTag: '',
      keyVersion: streamEncryptionKeyVersion,
    };
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(streamEncryptionAlgorithm, getStreamEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    keyVersion: streamEncryptionKeyVersion,
  };
}

export function decryptStreamUrl(secret: EncryptedStreamSecret) {
  if (!secret.encrypted || !secret.iv || !secret.authTag) {
    return '';
  }

  const decipher = createDecipheriv(streamEncryptionAlgorithm, getStreamEncryptionKey(), Buffer.from(secret.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(secret.authTag, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(secret.encrypted, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}
