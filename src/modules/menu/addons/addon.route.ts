import { Router } from 'express';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';
import { validateRequest } from '@shared/utils/validateRequest';

import {
  addonHeaderSchema,
  createAddonSchema,
  updateAddonSchema,
  addonListQuerySchema,
  addonIdQuerySchema,
} from './addon.validator';
import {
  createAddonController,
  listAddonsController,
  getAddonController,
  updateAddonController,
  deleteAddonController,
} from './addon.controller';

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
