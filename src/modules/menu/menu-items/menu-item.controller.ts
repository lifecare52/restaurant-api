import {
  createMenuItem,
  listMenuItemsWithNested,
  getMenuItemWithNested,
  updateMenuItem,
  deleteMenuItem,
} from '@modules/menu/menu-items/menu-item.service';

import { API_MESSAGES } from '@shared/constants';

import type { Request, Response, NextFunction } from 'express';

const getTenant = (req: Request) => ({
  brandId: (req.headers['brand-id'] as string | undefined) || '',
  outletId: (req.headers['outlet-id'] as string | undefined) || '',
});

export const createMenuItemController = async (req: Request, res: Response, next: NextFunction) => {
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

export const listMenuItemsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const result = await listMenuItemsWithNested(
      brandId,
      outletId,
      req.query as import('@shared/interfaces/pagination').PaginationQuery,
    );

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

export const getMenuItemController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { menuItemId } = req.query as { menuItemId: string };

    const item = await getMenuItemWithNested(brandId, outletId, menuItemId);

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

export const updateMenuItemController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { menuItemId } = req.query as { menuItemId: string };

    const item = await updateMenuItem(brandId, menuItemId, req.body);

    if (!item) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      const result = await listMenuItemsWithNested(brandId, outletId, {
        page: 1,
        limit: 20,
        column: 'name',
        order: 'ASC',
      });
      res.locals.response = {
        status: true,
        code: 200,
        message: API_MESSAGES.MENU_ITEM_UPDATED,
        data: result.items,
        total: result.total,
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const deleteMenuItemController = async (req: Request, res: Response, next: NextFunction) => {
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
