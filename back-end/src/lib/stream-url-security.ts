import { isIP } from 'node:net';

interface StreamUrlValidationResult {
  ok: boolean;
  message?: string;
}

function normalizeHost(host: string) {
  return host.trim().toLowerCase();
}

function parseAllowedHosts() {
  const raw = process.env.STREAM_URL_ALLOWED_HOSTS?.trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((value) => normalizeHost(value))
    .filter((value) => value.length > 0);
}

function ipv4ToNumber(ip: string) {
  const octets = ip.split('.').map((segment) => Number(segment));
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
    return null;
  }

  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

function inIpv4Range(ip: string, start: string, end: string) {
  const parsedIp = ipv4ToNumber(ip);
  const parsedStart = ipv4ToNumber(start);
  const parsedEnd = ipv4ToNumber(end);
  if (parsedIp === null || parsedStart === null || parsedEnd === null) {
    return false;
  }

  return parsedIp >= parsedStart && parsedIp <= parsedEnd;
}

function isPrivateOrReservedIp(ip: string) {
  const ipType = isIP(ip);
  if (ipType === 4) {
    return (
      inIpv4Range(ip, '0.0.0.0', '0.255.255.255') ||
      inIpv4Range(ip, '10.0.0.0', '10.255.255.255') ||
      inIpv4Range(ip, '100.64.0.0', '100.127.255.255') ||
      inIpv4Range(ip, '127.0.0.0', '127.255.255.255') ||
      inIpv4Range(ip, '169.254.0.0', '169.254.255.255') ||
      inIpv4Range(ip, '172.16.0.0', '172.31.255.255') ||
      inIpv4Range(ip, '192.0.0.0', '192.0.0.255') ||
      inIpv4Range(ip, '192.168.0.0', '192.168.255.255') ||
      inIpv4Range(ip, '224.0.0.0', '239.255.255.255') ||
      inIpv4Range(ip, '240.0.0.0', '255.255.255.255')
    );
  }

  if (ipType === 6) {
    const normalized = ip.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
  }

  return false;
}

function isHostAllowedByPolicy(hostname: string) {
  const allowedHosts = parseAllowedHosts();
  if (allowedHosts.length === 0) {
    return true;
  }

  return allowedHosts.some((allowedHost) => hostname === allowedHost || hostname.endsWith(`.${allowedHost}`));
}

export function validateStreamSourceUrl(streamUrl: string): StreamUrlValidationResult {
  const value = streamUrl.trim();
  if (!value) {
    return { ok: true };
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, message: 'URL do stream invalida.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, message: 'URL do stream deve usar http ou https.' };
  }

  const hostname = normalizeHost(parsed.hostname);
  if (!hostname) {
    return { ok: false, message: 'Hostname do stream invalido.' };
  }

  if (hostname === 'localhost' || hostname.endsWith('.local')) {
    return { ok: false, message: 'Hostname de stream nao permitido.' };
  }

  if (!isHostAllowedByPolicy(hostname)) {
    return { ok: false, message: 'Hostname de stream fora da allowlist.' };
  }

  const ipType = isIP(hostname);
  if (ipType > 0 && isPrivateOrReservedIp(hostname)) {
    return { ok: false, message: 'Endereco de stream privado ou reservado nao permitido.' };
  }

  return { ok: true };
}
