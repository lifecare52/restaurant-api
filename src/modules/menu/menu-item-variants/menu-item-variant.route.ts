import { Router } from 'express';

import {
  createMenuItemVariantController,
  listMenuItemVariantsController,
  getMenuItemVariantController,
  updateMenuItemVariantController,
  deleteMenuItemVariantController,
} from '@modules/menu/menu-item-variants/menu-item-variant.controller';
import {
  createMenuItemVariantSchema,
  updateMenuItemVariantSchema,
  menuItemVariantHeaderSchema,
  menuItemVariantListQuerySchema,
  menuItemVariantIdQuerySchema,
} from '@modules/menu/menu-item-variants/menu-item-variant.validator';

import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

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
