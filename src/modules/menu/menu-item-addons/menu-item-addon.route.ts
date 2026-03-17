import { Router } from 'express';

import {
  createMenuItemAddonController,
  listMenuItemAddonsController,
  getMenuItemAddonController,
  updateMenuItemAddonController,
  deleteMenuItemAddonController,
  createBulkMenuItemAddonController,
  getAddonMappingController
} from '@modules/menu/menu-item-addons/menu-item-addon.controller';
import {
  createMenuItemAddonSchema,
  updateMenuItemAddonSchema,
  menuItemAddonListQuerySchema,
  menuItemAddonIdQuerySchema,
  createBulkMenuItemAddonSchema,
  addonMappingQuerySchema
} from '@modules/menu/menu-item-addons/menu-item-addon.validator';

import { commonHeaderSchema } from '@shared/utils/common.validation';
import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

const router = Router();

router.post(
  '/menu-item-addons/bulk',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(createBulkMenuItemAddonSchema),
  createBulkMenuItemAddonController
);

router.post(
  '/menu-item-addons',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(createMenuItemAddonSchema),
  createMenuItemAddonController
);

router.get(
  '/menu-item-addons/addon-mapping',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(addonMappingQuerySchema, 'query'),
  getAddonMappingController
);

router.get(
  '/menu-item-addons',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemAddonListQuerySchema, 'query'),
  listMenuItemAddonsController
);

router.get(
  '/menu-item-addons/detail',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemAddonIdQuerySchema, 'query'),
  getMenuItemAddonController
);

router.patch(
  '/menu-item-addons',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemAddonIdQuerySchema, 'query'),
  validateRequest(updateMenuItemAddonSchema),
  updateMenuItemAddonController
);

router.delete(
  '/menu-item-addons',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemAddonIdQuerySchema, 'query'),
  deleteMenuItemAddonController
);

export default router;
