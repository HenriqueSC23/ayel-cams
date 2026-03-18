type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = (process.env.LOG_LEVEL || 'info').trim().toLowerCase() as LogLevel;
const minimumLevel: LogLevel = configuredLevel in levelPriority ? configuredLevel : 'info';

function shouldLog(level: LogLevel) {
  return levelPriority[level] >= levelPriority[minimumLevel];
}

function write(level: LogLevel, event: string, context: Record<string, unknown>) {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: 'ayel-cams-api',
    ...context,
  };

  const serialized = JSON.stringify(payload);
  if (level === 'error') {
    console.error(serialized);
    return;
  }

  if (level === 'warn') {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export function logDebug(event: string, context: Record<string, unknown> = {}) {
  write('debug', event, context);
}

export function logInfo(event: string, context: Record<string, unknown> = {}) {
  write('info', event, context);
}

export function logWarn(event: string, context: Record<string, unknown> = {}) {
  write('warn', event, context);
}

export function logError(event: string, context: Record<string, unknown> = {}) {
  write('error', event, context);
}
