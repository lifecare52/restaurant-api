import { Router } from 'express';

import {
  createTableController,
  listTablesController,
  listActiveTablesController,
  getTableController,
  updateTableController,
  updateTableStatusController,
  deleteTableController,
} from '@modules/table/table.controller';
import {
  createTableSchema,
  updateTableSchema,
  updateTableStatusSchema,
  tableListQuerySchema,
  tableIdQuerySchema,
} from '@modules/table/table.validator';

import { ROLES } from '@shared/constants';
import { commonHeaderSchema } from '@shared/utils/common.validation';
import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import {
  requireBrandAccess,
  requireOutletAccess,
  requireRole,
} from '@middlewares/guard.middleware';

const router = Router({ mergeParams: true });

const ADMIN_RLS = [ROLES.ADMIN, ROLES.OWNER];

router.post(
  '/',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  requireRole(ADMIN_RLS),
  validateRequest(createTableSchema),
  createTableController,
);

router.get(
  '/',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(tableListQuerySchema, 'query'),
  listTablesController,
);

router.get(
  '/active',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  listActiveTablesController,
);

router.get(
  '/detail',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  validateRequest(tableIdQuerySchema, 'query'),
  requireBrandAccess,
  requireOutletAccess,
  getTableController,
);

router.patch(
  '/',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  validateRequest(tableIdQuerySchema, 'query'),
  requireBrandAccess,
  requireOutletAccess,
  requireRole(ADMIN_RLS),
  validateRequest(updateTableSchema),
  updateTableController,
);

// This endpoint could be accessed by staff (captain/waiter) to update status
router.patch(
  '/status',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  validateRequest(tableIdQuerySchema, 'query'),
  requireBrandAccess,
  requireOutletAccess,
  validateRequest(updateTableStatusSchema),
  updateTableStatusController,
);

router.delete(
  '/',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  validateRequest(tableIdQuerySchema, 'query'),
  requireBrandAccess,
  requireOutletAccess,
  requireRole(ADMIN_RLS),
  deleteTableController,
);

export default router;
