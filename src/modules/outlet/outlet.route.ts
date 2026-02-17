import { Router } from 'express';

import {
  createOutletController,
  listOutletsController,
  updateOutletController,
  getOutletDetailController,
} from '@modules/outlet/outlet.controller';
import {
  createOutletSchema,
  updateOutletSchema,
  outletBrandHeaderSchema,
  outletUpdateQuerySchema,
  outletDetailHeaderSchema,
} from '@modules/outlet/outlet.validator';

import { ROLES, PERMISSIONS } from '@shared/constants';
import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import {
  requireBrandAccess,
  requireOutletAccess,
  requireRole,
  requirePermissionsOrAdmin,
} from '@middlewares/guard.middleware';

const router = Router({ mergeParams: true });

router.post(
  '/outlets',
  auth,
  validateRequest(outletBrandHeaderSchema, 'headers'),
  requireBrandAccess,
  requireRole([ROLES.ADMIN, ROLES.OWNER]),
  requirePermissionsOrAdmin([PERMISSIONS.OUTLET_MANAGEMENT]),
  validateRequest(createOutletSchema),
  createOutletController,
);

router.get(
  '/outlets',
  auth,
  validateRequest(outletBrandHeaderSchema, 'headers'),
  requireBrandAccess,
  listOutletsController,
);

router.get(
  '/outlets/detail',
  auth,
  validateRequest(outletDetailHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  getOutletDetailController,
);

router.patch(
  '/outlets',
  auth,
  validateRequest(outletUpdateQuerySchema, 'query'),
  requireBrandAccess,
  requireOutletAccess,
  requireRole([ROLES.ADMIN, ROLES.OWNER]),
  requirePermissionsOrAdmin([PERMISSIONS.OUTLET_MANAGEMENT]),
  validateRequest(updateOutletSchema),
  updateOutletController,
);

export default router;
