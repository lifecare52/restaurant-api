import { createOutlet, listOutlets, updateOutlet, getOutletById } from '@modules/outlet/outlet.service';

import type { Request, Response, NextFunction } from 'express';

export const createOutletController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = (req.headers['brand-id'] as string) || '';
    const outlet = await createOutlet(brandId, req.body);
    if (!outlet) {
      res.locals.response = {
        status: false,
        code: 400,
        message: 'Outlet limit reached or brand not found',
      };
    } else {
      res.locals.response = {
        status: true,
        code: 201,
        data: outlet,
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const listOutletsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = (req.headers['brand-id'] as string) || '';
    const outlets = await listOutlets(brandId);
    res.locals.response = {
      status: true,
      code: 200,
      data: outlets,
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const updateOutletController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = req.query as { brandId: string; outletId: string };
    const outlet = await updateOutlet(brandId, outletId, req.body);
    if (!outlet) {
      res.locals.response = {
        status: false,
        code: 404,
        message: 'Not Found',
      };
    } else {
      res.locals.response = {
        status: true,
        code: 200,
        data: outlet,
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const getOutletDetailController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = (req.headers['brand-id'] as string) || '';
    const outletId = (req.headers['outlet-id'] as string) || '';
    const outlet = await getOutletById(brandId, outletId);
    if (!outlet) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      res.locals.response = { status: true, code: 200, data: outlet };
    }
    next();
  } catch (err) {
    next(err);
  }
};
