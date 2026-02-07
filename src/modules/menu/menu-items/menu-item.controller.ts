import type { Request, Response, NextFunction } from 'express';

import {
  createMenuItem,
  listMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from './menu-item.service';
import { API_MESSAGES } from '@shared/constants';

const getTenant = (req: Request) => ({
  brandId: (req.headers['brand-id'] as string | undefined) || '',
  outletId: (req.headers['outlet-id'] as string | undefined) || '',
});

export const createMenuItemController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const item = await createMenuItem(brandId, outletId, req.body);

    if (!item) {
      res.locals.response = {
        status: false,
        code: 400,
        message: 'Brand or outlet not found',
      };
    } else {
      res.locals.response = {
        status: true,
        code: 201,
        message: API_MESSAGES.MENU_ITEM_CREATED,
        data: item,
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const listMenuItemsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const result = await listMenuItems(brandId, outletId, req.query as any);

    res.locals.response = {
      status: true,
      code: 200,
      data: result.items,
      total: result.total,
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const getMenuItemController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { brandId } = getTenant(req);
    const { menuItemId } = req.query as { menuItemId: string };

    const item = await getMenuItem(brandId, menuItemId);

    if (!item) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      res.locals.response = { status: true, code: 200, data: item };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const updateMenuItemController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { brandId } = getTenant(req);
    const { menuItemId } = req.query as { menuItemId: string };

    const item = await updateMenuItem(brandId, menuItemId, req.body);

    if (!item) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      res.locals.response = { status: true, code: 200, data: item };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const deleteMenuItemController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { brandId } = getTenant(req);
    const { menuItemId } = req.query as { menuItemId: string };

    const item = await deleteMenuItem(brandId, menuItemId);

    if (!item) {
      res.locals.response = {
        status: false,
        code: 404,
        message: API_MESSAGES.MENU_ITEM_NOT_FOUND,
      };
    } else {
      res.locals.response = {
        status: true,
        code: 200,
        message: API_MESSAGES.MENU_ITEM_DELETED,
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export default {
  createMenuItemController,
  listMenuItemsController,
  getMenuItemController,
  updateMenuItemController,
  deleteMenuItemController,
};
