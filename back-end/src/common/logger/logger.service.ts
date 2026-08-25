import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';

// ─── Log directory: back-end/logs/ ─────────────────────────────────────────
const LOG_DIR = path.join(process.cwd(), 'logs');

// ─── Sensitive keys that must never appear in logs ──────────────────────────
const SENSITIVE_KEYS = new Set([
  'password', 'passwd', 'secret', 'token', 'authorization',
  'x-auth-token', 'x-role', 'cookie', 'set-cookie',
  'credit_card', 'cvv', 'ssn',
]);

/** Recursively strip sensitive fields from any object before serialising */
function scrub(obj: unknown, depth = 0): unknown {
  if (depth > 6 || obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => scrub(item, depth + 1));

  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    safe[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : scrub(value, depth + 1);
  }
  return safe;
}

// ─── Shared log line format ──────────────────────────────────────────────────
const LOG_FORMAT = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),        // include stack traces
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const safeMeta = Object.keys(meta).length ? ' ' + JSON.stringify(scrub(meta)) : '';
    const stackLine = stack ? `\n  STACK: ${stack}` : '';
    return `[${timestamp}] [${level.toUpperCase().padEnd(5)}] ${message}${safeMeta}${stackLine}`;
  }),
);

// ─── Daily-rotate transport factory ─────────────────────────────────────────
function makeRotatingTransport(
  filename: string,
  level: string,
): winston.transport {
  return new winston.transports.DailyRotateFile({
    dirname: LOG_DIR,
    filename: `${filename}-%DATE%`,
    extension: '.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,          // gzip rotated files
    maxSize: '10m',               // rotate when file hits 10 MB
    maxFiles: '14d',              // keep 14 days of logs
    level,
    format: LOG_FORMAT,
    auditFile: path.join(LOG_DIR, `.${filename}-audit.json`),
  }) as unknown as winston.transport;
}

// ─── Three dedicated winston loggers ────────────────────────────────────────

/** application.log — all levels (info and above) */
const applicationLogger = winston.createLogger({
  level: 'info',
  transports: [makeRotatingTransport('application', 'info')],
  exceptionHandlers: [makeRotatingTransport('error', 'error')],
  rejectionHandlers: [makeRotatingTransport('error', 'error')],
});

/** error.log — error level only */
const errorLogger = winston.createLogger({
  level: 'error',
  transports: [makeRotatingTransport('error', 'error')],
});

/** admin.log — admin-scoped actions */
const adminLogger = winston.createLogger({
  level: 'info',
  transports: [makeRotatingTransport('admin', 'info')],
});

// In development also mirror to console (colourised, no file noise)
if (process.env.NODE_ENV !== 'production') {
  const consoleFmt = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) =>
      `[${timestamp}] ${level}: ${message}`,
    ),
  );
  applicationLogger.add(new winston.transports.Console({ format: consoleFmt, level: 'debug' }));
}

// ─── Injectable service ──────────────────────────────────────────────────────

@Injectable()
export class LoggerService implements NestLoggerService {

  // ── Standard NestJS LoggerService interface ─────────────────────────

  /** General informational message → application.log */
  log(message: string, context?: string, meta?: Record<string, unknown>): void {
    applicationLogger.info(message, { context, ...scrub(meta || {}) as object });
  }

  /** Error message → error.log AND application.log */
  error(message: string, trace?: string, context?: string, meta?: Record<string, unknown>): void {
    const payload = { context, stack: trace, ...scrub(meta || {}) as object };
    errorLogger.error(message, payload);
    applicationLogger.error(message, payload);
  }

  /** Warning → application.log */
  warn(message: string, context?: string, meta?: Record<string, unknown>): void {
    applicationLogger.warn(message, { context, ...scrub(meta || {}) as object });
  }

  /** Debug → application.log (suppressed in production) */
  debug(message: string, context?: string, meta?: Record<string, unknown>): void {
    applicationLogger.debug(message, { context, ...scrub(meta || {}) as object });
  }

  /** Verbose → application.log */
  verbose(message: string, context?: string): void {
    applicationLogger.verbose(message, { context });
  }

  // ── Click2Book-specific helpers ─────────────────────────────────────

  /**
   * Write an admin action to admin.log.
   * Use this for any ADMIN-role operation: login, report generation,
   * user management, approvals, etc.
   *
   * @param action   Short verb: 'LOGIN', 'GENERATE_REPORT', 'DELETE_USER', …
   * @param adminId  The admin's ID (e.g. 'ADMIN001')
   * @param details  Additional context (must NOT contain passwords or tokens)
   */
  adminLog(action: string, adminId: string, details?: Record<string, unknown>): void {
    const payload = {
      action,
      adminId,
      timestamp: new Date().toISOString(),
      ...scrub(details || {}) as object,
    };
    adminLogger.info(`ADMIN_ACTION: ${action}`, payload);
    // Also mirror to application.log at info level
    applicationLogger.info(`ADMIN_ACTION: ${action} [adminId=${adminId}]`, payload);
  }

  /**
   * Log an incoming HTTP request (called by LoggingMiddleware in the next phase).
   * Sensitive headers (authorization, cookie, x-role) are automatically stripped.
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTimeMs: number,
    meta?: Record<string, unknown>,
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    const message = `${method} ${url} ${statusCode} ${responseTimeMs}ms`;
    const safeMeta = scrub(meta || {}) as object;

    applicationLogger.log(level, message, safeMeta);

    if (statusCode >= 500) {
      errorLogger.error(message, safeMeta);
    }
  }
}
