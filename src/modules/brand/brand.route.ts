import { Router } from 'express';

import {
  createBrandController,
  getBrandController,
  updateBrandController,
} from '@modules/brand/brand.controller';
import {
  createBrandSchema,
  updateBrandSchema,
  brandHeaderSchema,
} from '@modules/brand/brand.validator';

import { ROLES, PERMISSIONS } from '@shared/constants';
import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireRole, requireBrandAccess, requirePermissions } from '@middlewares/guard.middleware';

const router = Router();

router.post(
  '/',
  auth,
  requireRole([ROLES.ADMIN]),
  validateRequest(createBrandSchema),
  createBrandController,
);

router.get(
  '/',
  auth,
  validateRequest(brandHeaderSchema, 'headers'),
  requireBrandAccess,
  getBrandController,
);

router.patch(
  '/',
  auth,
  validateRequest(brandHeaderSchema, 'headers'),
  requireBrandAccess,
  requireRole([ROLES.OWNER, ROLES.PARTNER, ROLES.ADMIN]),
  requirePermissions([PERMISSIONS.BRAND_MANAGEMENT]),
  validateRequest(updateBrandSchema),
  updateBrandController,
);

export default router;
