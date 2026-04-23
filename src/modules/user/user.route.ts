import { Router } from 'express';

import {
  createAdminBootstrapController,
  createAdminController,
  loginController,
  adminLoginController,
  createOwnerController,
  createOutletUserController,
  listOutletUsersController,
  getOutletUserController,
  updateOutletUserController,
  deleteOutletUserController
} from '@modules/user/user.controller';
import {
  createAdminSchema,
  createOwnerSchema,
  createUserSchema,
  loginSchema,
  userListQuerySchema,
  userIdQuerySchema,
  updateUserSchema
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
  createAdminBootstrapController
);

router.post(
  '/admins',
  auth,
  requireRole([ROLES.ADMIN]),
  validateRequest(createAdminSchema),
  createAdminController
);

router.post(
  '/owners',
  auth,
  requireRole([ROLES.ADMIN]),
  validateRequest(createOwnerSchema),
  createOwnerController
);

router.post(
  '/',
  auth,
  requireBrandAccess,
  // requirePermissions([PERMISSIONS.USER_MANAGEMENT]),
  validateRequest(createUserSchema),
  createOutletUserController
);

router.get(
  '/',
  auth,
  requireBrandAccess,
  // requirePermissions([PERMISSIONS.USER_MANAGEMENT]),
  validateRequest(userListQuerySchema, 'query'),
  listOutletUsersController
);

router.get(
  '/detail',
  auth,
  requireBrandAccess,
  // requirePermissions([PERMISSIONS.USER_MANAGEMENT]),
  validateRequest(userIdQuerySchema, 'query'),
  getOutletUserController
);

router.patch(
  '/',
  auth,
  requireBrandAccess,
  // requirePermissions([PERMISSIONS.USER_MANAGEMENT]),
  validateRequest(userIdQuerySchema, 'query'),
  validateRequest(updateUserSchema),
  updateOutletUserController
);

router.delete(
  '/',
  auth,
  requireBrandAccess,
  // requirePermissions([PERMISSIONS.USER_MANAGEMENT]),
  validateRequest(userIdQuerySchema, 'query'),
  deleteOutletUserController
);

export default router;
