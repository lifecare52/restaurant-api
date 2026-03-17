import AddonService from '@modules/menu/addons/addon.service';
import type { AddonCreateDTO, AddonUpdateDTO } from '@modules/menu/addons/addon.types';

import { API_MESSAGES } from '@shared/constants';

import type { Request, Response, NextFunction } from 'express';

export const createAddonController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = req.headers['brand-id'] as string;
    const outletId = req.headers['outlet-id'] as string;
    const dto = req.body as AddonCreateDTO;
    const v = await AddonService.createAddon(brandId, outletId, dto);
    if (!v) {
      res.locals.response = { status: false, code: 400, message: 'Brand or outlet not found' };
    } else {
      res.locals.response = {
        status: true,
        code: 201,
        message: API_MESSAGES.ADDON_CREATED,
        data: v
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const listAddonsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = req.headers['brand-id'] as string;
    const outletId = req.headers['outlet-id'] as string;
    const { page, limit, searchText, column, order } = req.query as {
      page?: string;
      limit?: string;
      searchText?: string;
      column?: string;
      order?: 'ASC' | 'DESC';
    };
    const result = await AddonService.listAddons(brandId, outletId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      searchText,
      column,
      order
    });
    res.locals.response = { status: true, code: 200, data: result.items, total: result.total };
    next();
  } catch (err) {
    next(err);
  }
};

export const listActiveAddonsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const brandId = req.headers['brand-id'] as string;
    const outletId = req.headers['outlet-id'] as string;
    const items = await AddonService.listActiveAddons(brandId, outletId);
    res.locals.response = { status: true, code: 200, data: items };
    next();
  } catch (err) {
    next(err);
  }
};

export const getAddonController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = req.headers['brand-id'] as string;
    const outletId = req.headers['outlet-id'] as string;
    const { addonId } = req.query as { addonId: string };
    const v = await AddonService.getAddon(brandId, outletId, addonId);
    if (!v) {
      res.locals.response = { status: false, code: 404, message: API_MESSAGES.ADDON_NOT_FOUND };
    } else {
      res.locals.response = { status: true, code: 200, data: v };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const updateAddonController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = req.headers['brand-id'] as string;
    const outletId = req.headers['outlet-id'] as string;
    const { addonId } = req.query as { addonId: string };
    const dto = req.body as AddonUpdateDTO;
    const v = await AddonService.updateAddon(brandId, outletId, addonId, dto);
    if (!v) {
      res.locals.response = { status: false, code: 404, message: API_MESSAGES.ADDON_NOT_FOUND };
    } else {
      res.locals.response = {
        status: true,
        code: 200,
        message: API_MESSAGES.ADDON_UPDATED,
        data: v
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const deleteAddonController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = req.headers['brand-id'] as string;
    const outletId = req.headers['outlet-id'] as string;
    const { addonId } = req.query as { addonId: string };
    const v = await AddonService.deleteAddon(brandId, outletId, addonId);
    if (!v) {
      res.locals.response = { status: false, code: 404, message: API_MESSAGES.ADDON_NOT_FOUND };
    } else {
      res.locals.response = { status: true, code: 200, message: API_MESSAGES.ADDON_DELETED };
    }
    next();
  } catch (err) {
    next(err);
  }
};
