import { Router } from 'express';

import { auth } from '@middlewares/auth.middleware';
import {
  requireBrandAccess,
  requireOutletAccess,
  requireRole,
  requirePermissionsOrAdmin,
} from '@middlewares/guard.middleware';

import { ROLES, PERMISSIONS } from '@shared/constants';
import { validateRequest } from '@shared/utils/validateRequest';

import {
  createOutletController,
  listOutletsController,
  updateOutletController,
} from './outlet.controller';
import { createOutletSchema, updateOutletSchema } from './outlet.validator';

const router = Router({ mergeParams: true });

router.post(
  '/:brandId/outlets',
  auth,
  requireBrandAccess,
  requireRole([ROLES.ADMIN, ROLES.OWNER]),
  requirePermissionsOrAdmin([PERMISSIONS.OUTLET_MANAGEMENT]),
  validateRequest(createOutletSchema),
  createOutletController,
);

router.get('/:brandId/outlets', auth, requireBrandAccess, listOutletsController);

router.patch(
  '/:brandId/outlets/:outletId',
  auth,
  requireBrandAccess,
  requireOutletAccess,
  requireRole([ROLES.ADMIN, ROLES.OWNER]),
  requirePermissionsOrAdmin([PERMISSIONS.OUTLET_MANAGEMENT]),
  validateRequest(updateOutletSchema),
  updateOutletController,
);

export default router;
