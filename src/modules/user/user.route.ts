import { Router } from 'express';

import {
  createAdminBootstrapController,
  createAdminController,
  loginController,
  adminLoginController,
  createOwnerController,
  createUserController,
} from '@modules/user/user.controller';
import {
  createAdminSchema,
  createOwnerSchema,
  createUserSchema,
  loginSchema,
} from '@modules/user/user.validator';

import { ROLES, PERMISSIONS } from '@shared/constants';
import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireRole, requirePermissions, requireBrandAccess } from '@middlewares/guard.middleware';

const router = Router();

router.post('/login', validateRequest(loginSchema), loginController);

router.post('/admins/login', validateRequest(loginSchema), adminLoginController);

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
