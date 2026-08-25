import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto'; // Node.js built-in — no extra dependency required

/**
 * RequestIdMiddleware — Click2Book Phase 3B
 *
 * Generates a unique UUID for every incoming HTTP request and:
 *   1. Reads an existing x-request-id if the upstream client provided one.
 *   2. Generates a fresh UUID if none was supplied.
 *   3. Attaches it to the request object so downstream middleware
 *      (LoggingMiddleware, GlobalExceptionFilter) can reference it.
 *   4. Returns it to the client as the `x-request-id` response header.
 *
 * No sensitive data is handled or logged here.
 * Registered in AppModule.configure() for ALL routes.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Honour a forwarded request ID (e.g. from a load balancer or API gateway).
    // Fall back to a fresh v4 UUID if none was provided.
    const existingId = req.headers['x-request-id'];
    const requestId =
      typeof existingId === 'string' && existingId.trim().length > 0
        ? existingId.trim()
        : randomUUID();

    // Attach to the request so other middleware can read it
    (req as any).requestId = requestId;

    // Send back in the response header so callers can correlate logs
    res.setHeader('x-request-id', requestId);

    next();
  }
}
