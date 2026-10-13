import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PlatformService } from './platform.service';

const VERB: Record<string, string> = {
  POST: 'Created',
  PUT: 'Updated',
  PATCH: 'Changed',
  DELETE: 'Deleted',
};

/** "PATCH /api/providers/P003/approve" → "Changed providers P003 (approve)". */
function describe(method: string, path: string): string {
  const parts = path
    .replace(/^\/api\//, '')
    .split('?')[0]
    .split('/')
    .filter(Boolean);
  const [resource, id, action] = parts;
  return [VERB[method] || method, resource, id, action ? `(${action})` : '']
    .filter(Boolean)
    .join(' ');
}

/**
 * Records every state-changing request made with `x-role: ADMIN` so the Super
 * Admin can monitor admin activity. Bodies are never stored (they can contain passwords).
 */
@Injectable()
export class AdminActivityMiddleware implements NestMiddleware {
  constructor(private readonly platform: PlatformService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const role = String(req.headers['x-role'] || '').toUpperCase();
    if (role !== 'ADMIN' || req.method === 'GET' || req.method === 'OPTIONS')
      return next();
    const path = req.originalUrl || req.url;
    res.on('finish', () => {
      this.platform.record({
        actor: String(req.headers['x-admin-email'] || 'ADMIN'),
        role,
        method: req.method,
        path: path.split('?')[0],
        status: res.statusCode,
        action: describe(req.method, path),
      });
    });
    next();
  }
}
