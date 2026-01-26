import { verifyToken } from '@shared/utils/jwt';

import type { Request, Response, NextFunction } from 'express';

export const auth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' });
    return;
  }
  const token = header.split(' ')[1];
  try {
    const claims = verifyToken(token);
    req.user = claims;
    next();
  } catch {
    next({ status: 401, code: 'INVALID_TOKEN', message: 'Invalid token' });
  }
};

export default auth;
