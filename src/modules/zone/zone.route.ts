import { Router } from 'express';

import {
  createZoneController,
  listZonesController,
  listActiveZonesController,
  getZoneController,
  updateZoneController,
  deleteZoneController,
} from '@modules/zone/zone.controller';
import {
  createZoneSchema,
  updateZoneSchema,
  zoneListQuerySchema,
  zoneIdQuerySchema,
} from '@modules/zone/zone.validator';

import { ROLES, PERMISSIONS } from '@shared/constants';
import { commonHeaderSchema } from '@shared/utils/common.validation';
import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import {
  requireBrandAccess,
  requireOutletAccess,
  requireRole,
  requirePermissionsOrAdmin,
} from '@middlewares/guard.middleware';

const router = Router({ mergeParams: true });

const PERM = [PERMISSIONS.OUTLET_MANAGEMENT];
const RLS = [ROLES.ADMIN, ROLES.OWNER];

router.post(
  '/',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  requireRole(RLS),
  requirePermissionsOrAdmin(PERM),
  validateRequest(createZoneSchema),
  createZoneController,
);

router.get(
  '/',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(zoneListQuerySchema, 'query'),
  listZonesController,
);

router.get(
  '/active',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  listActiveZonesController,
);

router.get(
  '/detail',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  validateRequest(zoneIdQuerySchema, 'query'),
  requireBrandAccess,
  requireOutletAccess,
  getZoneController,
);

router.patch(
  '/',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  validateRequest(zoneIdQuerySchema, 'query'),
  requireBrandAccess,
  requireOutletAccess,
  requireRole(RLS),
  requirePermissionsOrAdmin(PERM),
  validateRequest(updateZoneSchema),
  updateZoneController,
);

router.delete(
  '/',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  validateRequest(zoneIdQuerySchema, 'query'),
  requireBrandAccess,
  requireOutletAccess,
  requireRole(RLS),
  requirePermissionsOrAdmin(PERM),
  deleteZoneController,
);

export default router;
