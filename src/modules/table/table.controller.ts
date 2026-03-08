import {
  createTable,
  listTables,
  getTable,
  updateTable,
  updateTableStatus,
  deleteTable,
  getTableLiveOrders,
} from '@modules/table/table.service';

import type { Request, Response, NextFunction } from 'express';

const getTenant = (req: Request) => ({
  brandId: (req.headers['brand-id'] as string | undefined) || '',
  outletId: (req.headers['outlet-id'] as string | undefined) || '',
});

export const createTableController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const item = await createTable(brandId, outletId, req.body);
    res.locals.response = {
      status: true,
      code: 201,
      message: 'Table created successfully',
      data: item,
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const listTablesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const result = await listTables(brandId, outletId, req.query);
    res.locals.response = { status: true, code: 200, data: result.items, total: result.total };
    next();
  } catch (err) {
    next(err);
  }
};

export const getTableController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { tableId } = req.query as { tableId: string };
    const item = await getTable(brandId, outletId, tableId);
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

export const updateTableController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { tableId } = req.query as { tableId: string };
    const item = await updateTable(brandId, outletId, tableId, req.body);
    if (!item) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      res.locals.response = {
        status: true,
        code: 200,
        message: 'Table updated successfully',
        data: item,
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const updateTableStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { tableId } = req.query as { tableId: string };
    const { status } = req.body;
    const item = await updateTableStatus(brandId, outletId, tableId, status);
    if (!item) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      res.locals.response = {
        status: true,
        code: 200,
        message: 'Table status updated successfully',
        data: item,
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const deleteTableController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { tableId } = req.query as { tableId: string };
    const item = await deleteTable(brandId, outletId, tableId);
    if (!item) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      res.locals.response = { status: true, code: 200, message: 'Table deleted successfully' };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const getTableLiveOrdersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { tableId } = req.query as { tableId: string };
    const items = await getTableLiveOrders(brandId, outletId, tableId);
    res.locals.response = { status: true, code: 200, data: items };
    next();
  } catch (err) {
    next(err);
  }
};

