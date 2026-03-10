import { Router } from 'express';

import { commonHeaderSchema } from '@shared/utils/common.validation';
import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

import { getPosMenuController } from './order-menu-item.controller';

const router = Router();

/**
 * GET /api/v1/order/menu-items
 * Requires: brand-id + outlet-id headers, valid auth token.
 */
router.get(
  '/',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  getPosMenuController
);

export default router;
