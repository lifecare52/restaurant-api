import { Router } from 'express';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';
import { validateRequest } from '@shared/utils/validateRequest';

import {
  menuItemAddonHeaderSchema,
  createMenuItemAddonSchema,
  updateMenuItemAddonSchema,
  menuItemAddonListQuerySchema,
  menuItemAddonIdQuerySchema,
} from './menu-item-addon.validator';
import {
  createMenuItemAddonController,
  listMenuItemAddonsController,
  getMenuItemAddonController,
  updateMenuItemAddonController,
  deleteMenuItemAddonController,
} from './menu-item-addon.controller';

const router = Router();

router.post(
  '/menu-item-addons',
  auth,
  validateRequest(menuItemAddonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(createMenuItemAddonSchema),
  createMenuItemAddonController,
);

router.get(
  '/menu-item-addons',
  auth,
  validateRequest(menuItemAddonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemAddonListQuerySchema, 'query'),
  listMenuItemAddonsController,
);

router.get(
  '/menu-item-addons/detail',
  auth,
  validateRequest(menuItemAddonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemAddonIdQuerySchema, 'query'),
  getMenuItemAddonController,
);

router.patch(
  '/menu-item-addons',
  auth,
  validateRequest(menuItemAddonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemAddonIdQuerySchema, 'query'),
  validateRequest(updateMenuItemAddonSchema),
  updateMenuItemAddonController,
);

router.delete(
  '/menu-item-addons',
  auth,
  validateRequest(menuItemAddonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(menuItemAddonIdQuerySchema, 'query'),
  deleteMenuItemAddonController,
);

export default router;
