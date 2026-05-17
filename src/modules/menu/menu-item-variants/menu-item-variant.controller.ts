import {
  createMenuItemVariant,
  listMenuItemVariants,
  getMenuItemVariant,
  updateMenuItemVariant,
  deleteMenuItemVariant,
} from '@modules/menu/menu-item-variants/menu-item-variant.service';

import { API_MESSAGES } from '@shared/constants';

import { MenuItemVariantListQuery } from './menu-item-variant.types';

import type { Request, Response, NextFunction } from 'express';

const getTenant = (req: Request) => ({
  brandId: (req.headers['brand-id'] as string | undefined) || '',
  outletId: (req.headers['outlet-id'] as string | undefined) || '',
});

export const createMenuItemVariantController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const r = await createMenuItemVariant(brandId, outletId, req.body);
    if (!r) {
      res.locals.response = {
        status: false,
        code: 400,
        message: 'Brand, outlet, item or variation not found',
      };
    } else {
      res.locals.response = {
        status: true,
        code: 201,
        message: API_MESSAGES.MENU_ITEM_VARIANT_CREATED,
        data: r,
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const listMenuItemVariantsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const result = await listMenuItemVariants(
      brandId,
      outletId,
      req.query as MenuItemVariantListQuery,
    );
    res.locals.response = { status: true, code: 200, data: result.items, total: result.total };
    next();
  } catch (err) {
    next(err);
  }
};

export const getMenuItemVariantController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { menuItemVariantId } = req.query as { menuItemVariantId: string };
    const r = await getMenuItemVariant(brandId, outletId, menuItemVariantId);
    if (!r) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      res.locals.response = { status: true, code: 200, data: r };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const updateMenuItemVariantController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { menuItemVariantId } = req.query as { menuItemVariantId: string };
    const r = await updateMenuItemVariant(brandId, outletId, menuItemVariantId, req.body);
    if (!r) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      res.locals.response = { status: true, code: 200, data: r };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const deleteMenuItemVariantController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { menuItemVariantId } = req.query as { menuItemVariantId: string };
    const r = await deleteMenuItemVariant(brandId, outletId, menuItemVariantId);
    if (!r) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      res.locals.response = { status: true, code: 200, data: r };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export default {
  createMenuItemVariantController,
  listMenuItemVariantsController,
  getMenuItemVariantController,
  updateMenuItemVariantController,
  deleteMenuItemVariantController,
};
