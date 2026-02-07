import type { Request, Response, NextFunction } from 'express';

import { API_MESSAGES } from '@shared/constants';

import {
  createVariation,
  listVariations,
  getVariation,
  updateVariation,
  deleteVariation,
} from './variation.service';

const getTenant = (req: Request) => ({
  brandId: (req.headers['brand-id'] as string | undefined) || '',
  outletId: (req.headers['outlet-id'] as string | undefined) || '',
});

export const createVariationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const v = await createVariation(brandId, outletId, req.body);
    if (!v) {
      res.locals.response = {
        status: false,
        code: 400,
        message: 'Brand or outlet not found',
      };
    } else {
      res.locals.response = {
        status: true,
        code: 201,
        message: API_MESSAGES.VARIATION_CREATED,
        data: v,
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const listVariationsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const result = await listVariations(brandId, outletId, req.query as any);
    res.locals.response = { status: true, code: 200, data: result.items, total: result.total };
    next();
  } catch (err) {
    next(err);
  }
};

export const getVariationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { variationId } = req.query as { variationId: string };
    const v = await getVariation(brandId, outletId, variationId);
    if (!v) {
      res.locals.response = { status: false, code: 404, message: API_MESSAGES.VARIATION_NOT_FOUND };
    } else {
      res.locals.response = { status: true, code: 200, data: v };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const updateVariationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { variationId } = req.query as { variationId: string };
    const v = await updateVariation(brandId, outletId, variationId, req.body);
    if (!v) {
      res.locals.response = { status: false, code: 404, message: API_MESSAGES.VARIATION_NOT_FOUND };
    } else {
      res.locals.response = { status: true, code: 200, message: API_MESSAGES.VARIATION_UPDATED, data: v };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const deleteVariationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { variationId } = req.query as { variationId: string };
    const v = await deleteVariation(brandId, outletId, variationId);
    if (!v) {
      res.locals.response = { status: false, code: 404, message: API_MESSAGES.VARIATION_NOT_FOUND };
    } else {
      res.locals.response = { status: true, code: 200, message: API_MESSAGES.VARIATION_DELETED };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export default {
  createVariationController,
  listVariationsController,
  getVariationController,
  updateVariationController,
  deleteVariationController,
}
