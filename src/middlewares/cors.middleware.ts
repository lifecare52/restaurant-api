import { getCorsConfig } from '../config/cors';

import type { Request, Response, NextFunction } from 'express';

export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const cfg = getCorsConfig();
  const origin = (req.headers.origin as string | undefined) ?? '';
  const wildcard = cfg.allowedOrigins.includes('*');

  if (wildcard && !cfg.allowCredentials) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && (wildcard || cfg.allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  if (cfg.allowCredentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', cfg.allowedMethods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', cfg.allowedHeaders.join(', '));
  if (cfg.exposedHeaders.length > 0) {
    res.setHeader('Access-Control-Expose-Headers', cfg.exposedHeaders.join(', '));
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
};

export default corsMiddleware;
