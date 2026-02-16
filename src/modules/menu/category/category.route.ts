import { Router } from 'express';

import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

import {
  createCategoryController,
  listCategoriesController,
  getCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from './category.controller';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryListHeaderSchema,
  categoryListQuerySchema,
  categoryGetQuerySchema,
  categoryModifyQuerySchema,
  categoryBrandHeaderSchema,
} from './category.validator';

const router = Router();

router.post(
  '/categories',
  auth,
  validateRequest(categoryListHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(createCategorySchema),
  createCategoryController,
);

router.get(
  '/categories',
  auth,
  validateRequest(categoryListHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(categoryListQuerySchema, 'query'),
  listCategoriesController,
);

router.get(
  '/categories/detail',
  auth,
  validateRequest(categoryBrandHeaderSchema, 'headers'),
  validateRequest(categoryGetQuerySchema, 'query'),
  requireBrandAccess,
  getCategoryController,
);

router.patch(
  '/categories',
  auth,
  validateRequest(categoryBrandHeaderSchema, 'headers'),
  validateRequest(categoryModifyQuerySchema, 'query'),
  requireBrandAccess,
  validateRequest(updateCategorySchema),
  updateCategoryController,
);

router.delete(
  '/categories',
  auth,
  validateRequest(categoryBrandHeaderSchema, 'headers'),
  validateRequest(categoryModifyQuerySchema, 'query'),
  requireBrandAccess,
  deleteCategoryController,
);

export default router;
