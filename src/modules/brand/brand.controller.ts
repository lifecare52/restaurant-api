import { createBrand, getBrandById, updateBrand } from '@modules/brand/brand.service';

import { ROLES } from '@shared/constants';

import type { Request, Response, NextFunction } from 'express';

export const createBrandController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.user?.role;
    if (role !== ROLES.ADMIN) {
      res.locals.response = { status: false, code: 403, message: 'Forbidden' };
      next();
      return;
    }
    const brand = await createBrand(req.body);
    res.locals.response = { status: true, code: 201, data: brand };
    next();
  } catch (err) {
    next(err);
  }
};

export const getBrandController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = (req.headers['brand-id'] as string) || '';
    const brand = await getBrandById(brandId);
    if (!brand) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
      next();
      return;
    }
    res.locals.response = { status: true, code: 200, data: brand };
    next();
  } catch (err) {
    next(err);
  }
};

export const updateBrandController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.user?.role;
    const userBrandId = req.user?.brandId;
    if (role !== ROLES.ADMIN && !(role === ROLES.OWNER || role === ROLES.PARTNER)) {
      res.locals.response = { status: false, code: 403, message: 'Forbidden' };
      next();
      return;
    }
    const brandId = (req.headers['brand-id'] as string) || '';
    if (role !== ROLES.ADMIN && userBrandId !== brandId) {
      res.locals.response = { status: false, code: 403, message: 'Forbidden' };
      next();
      return;
    }
    const brand = await updateBrand(brandId, req.body);
    res.locals.response = { status: true, code: 200, data: brand };
    next();
  } catch (err) {
    next(err);
  }
};
