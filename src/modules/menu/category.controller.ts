import {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from './category.service';

import type { Request, Response, NextFunction } from 'express';

export const createCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId =
      (req.headers['brandid'] as string | undefined) ||
      (req.headers['brand-id'] as string | undefined) ||
      (req.headers['x-brand-id'] as string | undefined) ||
      '';
    const outletId =
      (req.headers['outletid'] as string | undefined) ||
      (req.headers['outlet-id'] as string | undefined) ||
      (req.headers['x-outlet-id'] as string | undefined) ||
      '';
    const category = await createCategory(brandId, outletId, req.body);
    if (!category) {
      res.locals.response = { status: false, code: 400, message: 'Brand or outlet not found' };
    } else {
      res.locals.response = { status: true, code: 201, data: category };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const listCategoriesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId =
      (req.headers['brandid'] as string | undefined) ||
      (req.headers['brand-id'] as string | undefined) ||
      (req.headers['x-brand-id'] as string | undefined) ||
      '';
    const outletId =
      (req.headers['outletid'] as string | undefined) ||
      (req.headers['outlet-id'] as string | undefined) ||
      (req.headers['x-outlet-id'] as string | undefined) ||
      '';
    const { page, limit, searchText, column, order } = req.query as {
      page?: number;
      limit?: number;
      searchText?: string;
      column?: string;
      order?: 'ASC' | 'DESC';
    };
    const result = await listCategories(brandId, outletId, {
      page,
      limit,
      searchText,
      column,
      order,
    });
    res.locals.response = { status: true, code: 200, data: result.items, total: result.total };
    next();
  } catch (err) {
    next(err);
  }
};

export const getCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId =
      (req.headers['brandid'] as string | undefined) ||
      (req.headers['brand-id'] as string | undefined) ||
      (req.headers['x-brand-id'] as string | undefined) ||
      '';
    const { categoryId } = req.query as { categoryId: string };
    const category = await getCategory(brandId, categoryId);
    if (!category) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      res.locals.response = { status: true, code: 200, data: category };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const updateCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId =
      (req.headers['brandid'] as string | undefined) ||
      (req.headers['brand-id'] as string | undefined) ||
      (req.headers['x-brand-id'] as string | undefined) ||
      '';
    const { categoryId } = req.query as { categoryId: string };
    const category = await updateCategory(brandId, categoryId, req.body);
    if (!category) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      res.locals.response = { status: true, code: 200, data: category };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const deleteCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId =
      (req.headers['brandid'] as string | undefined) ||
      (req.headers['brand-id'] as string | undefined) ||
      (req.headers['x-brand-id'] as string | undefined) ||
      '';
    const { categoryId } = req.query as { categoryId: string };
    const category = await deleteCategory(brandId, categoryId);
    if (!category) {
      res.locals.response = { status: false, code: 404, message: 'Not Found' };
    } else {
      res.locals.response = { status: true, code: 200, data: category };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export default {
  createCategoryController,
  listCategoriesController,
  getCategoryController,
  updateCategoryController,
  deleteCategoryController,
};
