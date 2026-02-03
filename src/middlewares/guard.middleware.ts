import { ROLES } from '@shared/constants';

import type { Request, Response, NextFunction, RequestHandler } from 'express';

export const requireRole = (roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      next({ status: 403, code: 'FORBIDDEN', message: 'Forbidden' });
      return;
    }
    next();
  };
};

export const requirePermissions = (perms: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPerms: string[] = req.user?.permissions || [];
    const ok = perms.every(p => userPerms.includes(p));
    if (!ok) {
      next({ status: 403, code: 'FORBIDDEN', message: 'Forbidden' });
      return;
    }
    next();
  };
};

export const requirePermissionsOrAdmin = (perms: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role === ROLES.ADMIN) {
      next();
      return;
    }
    const userPerms: string[] = req.user?.permissions || [];
    const ok = perms.every(p => userPerms.includes(p));
    if (!ok) {
      next({ status: 403, code: 'FORBIDDEN', message: 'Forbidden' });
      return;
    }
    next();
  };
};

export const requireBrandAccess: RequestHandler = (req, res, next) => {
  const brandIdParam =
    (req.params as Record<string, string>).brandId ||
    (req.query as Record<string, string>).brandId ||
    (req.body as { brandId?: string }).brandId ||
    (req.headers['brandid'] as string | undefined) ||
    (req.headers['brand-id'] as string | undefined) ||
    (req.headers['x-brand-id'] as string | undefined);
  const user = req.user;
  if (!brandIdParam) {
    next({ status: 400, code: 'BAD_REQUEST', message: 'brandId required' });
    return;
  }
  if (user?.role === ROLES.ADMIN) {
    next();
    return;
  }
  if (user?.brandId !== brandIdParam) {
    next({ status: 403, code: 'FORBIDDEN', message: 'Forbidden' });
    return;
  }
  next();
};

export const requireOutletAccess: RequestHandler = (req, res, next) => {
  const outletIdParam =
    (req.params as Record<string, string>).outletId ||
    (req.query as Record<string, string>).outletId ||
    (req.body as { outletId?: string }).outletId ||
    (req.headers['outletid'] as string | undefined) ||
    (req.headers['outlet-id'] as string | undefined) ||
    (req.headers['x-outlet-id'] as string | undefined);
  const user = req.user;
  if (!outletIdParam) {
    next({ status: 400, code: 'BAD_REQUEST', message: 'outletId required' });
    return;
  }
  if (user?.role === ROLES.ADMIN || user?.role === ROLES.OWNER) {
    next();
    return;
  }
  const list: string[] | undefined = user?.outlets;
  if (!list || list.length === 0) {
    next();
    return;
  }
  if (!list.includes(outletIdParam)) {
    next({ status: 403, code: 'FORBIDDEN', message: 'Forbidden' });
    return;
  }
  next();
};
