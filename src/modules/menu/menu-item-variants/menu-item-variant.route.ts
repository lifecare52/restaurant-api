import { Router } from 'express';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

import { validateRequest } from '@shared/utils/validateRequest';

import {
  createMenuItemVariantController,
  listMenuItemVariantsController,
  getMenuItemVariantController,
  updateMenuItemVariantController,
  deleteMenuItemVariantController,
} from './menu-item-variant.controller';
import {
  createMenuItemVariantSchema,
  updateMenuItemVariantSchema,
  menuItemVariantHeaderSchema,
  menuItemVariantListQuerySchema,
  menuItemVariantIdQuerySchema,
} from './menu-item-variant.validator';

const router = Router();

router.post(
  '/menu-item-variants',
  auth,
  validateRequest(menuItemVariantHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(createMenuItemVariantSchema),
  createMenuItemVariantController,
);

router.get(
  '/menu-item-variants',
  auth,
  validateRequest(menuItemVariantHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemVariantListQuerySchema, 'query'),
  listMenuItemVariantsController,
);

router.get(
  '/menu-item-variants/detail',
  auth,
  validateRequest(menuItemVariantHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemVariantIdQuerySchema, 'query'),
  getMenuItemVariantController,
);

router.patch(
  '/menu-item-variants',
  auth,
  validateRequest(menuItemVariantHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemVariantIdQuerySchema, 'query'),
  validateRequest(updateMenuItemVariantSchema),
  updateMenuItemVariantController,
);

router.delete(
  '/menu-item-variants',
  auth,
  validateRequest(menuItemVariantHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemVariantIdQuerySchema, 'query'),
  deleteMenuItemVariantController,
);

export default router;
