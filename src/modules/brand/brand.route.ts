import { Router } from 'express';

import { auth } from '@middlewares/auth.middleware';
import { requireRole, requireBrandAccess, requirePermissions } from '@middlewares/guard.middleware';

import { ROLES, PERMISSIONS } from '@shared/constants';
import { validateRequest } from '@shared/utils/validateRequest';

import {
  createBrandController,
  getBrandController,
  updateBrandController,
} from './brand.controller';
import { createBrandSchema, updateBrandSchema } from './brand.validator';

const router = Router();

router.post(
  '/',
  auth,
  requireRole([ROLES.ADMIN]),
  validateRequest(createBrandSchema),
  createBrandController,
);

router.get('/:brandId', auth, requireBrandAccess, getBrandController);

router.patch(
  '/:brandId',
  auth,
  requireBrandAccess,
  requireRole([ROLES.OWNER, ROLES.PARTNER, ROLES.ADMIN]),
  requirePermissions([PERMISSIONS.BRAND_MANAGEMENT]),
  validateRequest(updateBrandSchema),
  updateBrandController,
);

export default router;
