import { Router } from 'express';

import { commonHeaderSchema } from '@shared/utils/common.validation';
import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

import {
  createMenuItemController,
  deleteMenuItemController,
  getMenuItemController,
  listMenuItemsController,
  listMenuItemsCategoryWiseController,
  updateMenuItemController,
  bulkUpdateMenuItemAvailabilityController,
  getAddonMappingController,
} from './menu-item.controller';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  menuItemListQuerySchema,
  menuItemIdQuerySchema,
  bulkUpdateMenuItemAvailabilitySchema,
  addonMappingQuerySchema,
} from './menu-item.validator';

const router = Router();

router.post(
  '/',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(createMenuItemSchema),
  createMenuItemController,
);

router.get(
  '/addon-mapping',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(addonMappingQuerySchema, 'query'),
  getAddonMappingController,
);

router.get(
  '/',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemListQuerySchema, 'query'),
  listMenuItemsController,
);

router.get(
  '/category-wise',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  listMenuItemsCategoryWiseController,
);

router.get(
  '/detail',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemIdQuerySchema, 'query'),
  getMenuItemController,
);

router.patch(
  '/',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemIdQuerySchema, 'query'),
  validateRequest(updateMenuItemSchema),
  updateMenuItemController,
);

router.delete(
  '/',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemIdQuerySchema, 'query'),
  deleteMenuItemController,
);

router.patch(
  '/availability',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(bulkUpdateMenuItemAvailabilitySchema),
  bulkUpdateMenuItemAvailabilityController,
);

export default router;
