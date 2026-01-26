import { Router } from 'express';

import { auth } from '@middlewares/auth.middleware';
import { requireRole, requirePermissions, requireBrandAccess } from '@middlewares/guard.middleware';

import { ROLES, PERMISSIONS } from '@shared/constants';
import { validateRequest } from '@shared/utils/validateRequest';

import {
  createAdminBootstrapController,
  createAdminController,
  loginController,
  createOwnerController,
  createUserController,
} from './user.controller';
import {
  createAdminSchema,
  createOwnerSchema,
  createUserSchema,
  loginSchema,
} from './user.validator';

const router = Router();

router.post('/login', validateRequest(loginSchema), loginController);

router.post(
  '/admins/bootstrap',
  validateRequest(createAdminSchema),
  createAdminBootstrapController,
);

router.post(
  '/admins',
  auth,
  requireRole([ROLES.ADMIN]),
  validateRequest(createAdminSchema),
  createAdminController,
);

router.post(
  '/owners',
  auth,
  requireRole([ROLES.ADMIN]),
  validateRequest(createOwnerSchema),
  createOwnerController,
);

router.post(
  '/',
  auth,
  requireBrandAccess,
  requirePermissions([PERMISSIONS.USER_MANAGEMENT]),
  validateRequest(createUserSchema),
  createUserController,
);

export default router;
