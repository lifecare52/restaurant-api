import {
  createMenuItemAddon,
  listMenuItemAddons,
  getMenuItemAddon,
  updateMenuItemAddon,
  deleteMenuItemAddon,
  createBulkMenuItemAddons
} from '@modules/menu/menu-item-addons/menu-item-addon.service';
import type {
  MenuItemAddonCreateDTO,
  MenuItemAddonFilterQuery,
  MenuItemAddonListQuery,
  MenuItemAddonUpdateDTO,
  BulkMenuItemAddonCreateDTO
} from '@modules/menu/menu-item-addons/menu-item-addon.types';
import { getAddonMappingAggregationV2 } from '@modules/menu/menu-items/menu-item.service';

import { API_MESSAGES } from '@shared/constants';

import type { Request, Response, NextFunction } from 'express';

const getTenant = (req: Request) => ({
  brandId: (req.headers['brand-id'] as string | undefined) || '',
  outletId: (req.headers['outlet-id'] as string | undefined) || ''
});

export const createMenuItemAddonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const v = await createMenuItemAddon(brandId, outletId, req.body as MenuItemAddonCreateDTO);
    if (!v) {
      res.locals.response = {
        status: false,
        code: 400,
        message: 'Brand, outlet, item or addon not found'
      };
    } else {
      res.locals.response = {
        status: true,
        code: 201,
        message: API_MESSAGES.MENU_ITEM_ADDON_CREATED,
        data: v
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const createBulkMenuItemAddonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const result = await createBulkMenuItemAddons(
      brandId,
      outletId,
      req.body as BulkMenuItemAddonCreateDTO
    );
    res.locals.response = {
      status: true,
      code: 201,
      message: 'Bulk addons processed',
      data: result
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const listMenuItemAddonsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const result = await listMenuItemAddons(
      brandId,
      outletId,
      req.query as MenuItemAddonListQuery,
      req.query as MenuItemAddonFilterQuery
    );
    res.locals.response = { status: true, code: 200, data: result.items, total: result.total };
    next();
  } catch (err) {
    next(err);
  }
};

export const getMenuItemAddonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { menuItemAddonId } = req.query as { menuItemAddonId: string };
    const v = await getMenuItemAddon(brandId, outletId, menuItemAddonId);
    if (!v) {
      res.locals.response = {
        status: false,
        code: 404,
        message: API_MESSAGES.MENU_ITEM_ADDON_NOT_FOUND
      };
    } else {
      res.locals.response = { status: true, code: 200, data: v };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const updateMenuItemAddonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { menuItemAddonId } = req.query as { menuItemAddonId: string };
    const v = await updateMenuItemAddon(
      brandId,
      outletId,
      menuItemAddonId,
      req.body as MenuItemAddonUpdateDTO
    );
    if (!v) {
      res.locals.response = {
        status: false,
        code: 404,
        message: API_MESSAGES.MENU_ITEM_ADDON_NOT_FOUND
      };
    } else {
      res.locals.response = {
        status: true,
        code: 200,
        message: API_MESSAGES.MENU_ITEM_ADDON_UPDATED,
        data: v
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const deleteMenuItemAddonController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { menuItemAddonId } = req.query as { menuItemAddonId: string };
    const v = await deleteMenuItemAddon(brandId, outletId, menuItemAddonId);
    if (!v) {
      res.locals.response = {
        status: false,
        code: 404,
        message: API_MESSAGES.MENU_ITEM_ADDON_NOT_FOUND
      };
    } else {
      res.locals.response = {
        status: true,
        code: 200,
        message: API_MESSAGES.MENU_ITEM_ADDON_DELETED
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const getAddonMappingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const addonId = req.query.addonId as string;
    const dataV2 = await getAddonMappingAggregationV2(brandId, outletId, addonId);

    res.locals.response = {
      status: true,
      code: 200,
      data: dataV2
    };
    next();
  } catch (err) {
    next(err);
  }
};

export default {
  createMenuItemAddonController,
  listMenuItemAddonsController,
  getMenuItemAddonController,
  updateMenuItemAddonController,
  deleteMenuItemAddonController,
  getAddonMappingController
};
