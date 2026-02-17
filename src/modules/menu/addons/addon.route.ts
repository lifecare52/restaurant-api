import { Router } from 'express';

import {
  createAddonController,
  listAddonsController,
  listActiveAddonsController,
  getAddonController,
  updateAddonController,
  deleteAddonController,
} from '@modules/menu/addons/addon.controller';
import {
  addonHeaderSchema,
  createAddonSchema,
  updateAddonSchema,
  addonListQuerySchema,
  addonIdQuerySchema,
} from '@modules/menu/addons/addon.validator';

import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

const router = Router();

router.post(
  '/addons',
  auth,
  validateRequest(addonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(createAddonSchema),
  createAddonController,
);

router.get(
  '/addons',
  auth,
  validateRequest(addonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(addonListQuerySchema, 'query'),
  listAddonsController,
);

router.get(
  '/addons/active',
  auth,
  validateRequest(addonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  listActiveAddonsController,
);

router.get(
  '/addons/detail',
  auth,
  validateRequest(addonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(addonIdQuerySchema, 'query'),
  getAddonController,
);

router.patch(
  '/addons',
  auth,
  validateRequest(addonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(addonIdQuerySchema, 'query'),
  validateRequest(updateAddonSchema),
  updateAddonController,
);

router.delete(
  '/addons',
  auth,
  validateRequest(addonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(addonIdQuerySchema, 'query'),
  deleteAddonController,
);

export default router;
