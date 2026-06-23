const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => {
    if (shouldLog('debug')) console.debug(`[${formatTimestamp()}] [DEBUG] ${msg}`, meta ?? '');
  },
  info: (msg: string, meta?: Record<string, unknown>) => {
    if (shouldLog('info')) console.info(`[${formatTimestamp()}] [INFO] ${msg}`, meta ?? '');
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    if (shouldLog('warn')) console.warn(`[${formatTimestamp()}] [WARN] ${msg}`, meta ?? '');
  },
  error: (msg: string, meta?: Record<string, unknown>) => {
    if (shouldLog('error')) console.error(`[${formatTimestamp()}] [ERROR] ${msg}`, meta ?? '');
  },
};
