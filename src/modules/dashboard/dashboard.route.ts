import { Router } from 'express';
import { getDashboardSummaryController } from './dashboard.controller';
import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';
import { validateRequest } from '@shared/utils/validateRequest';
import { commonHeaderSchema } from '@shared/utils/common.validation';

const router = Router();

const tenantMiddleware = [
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess
];

/**
 * GET /api/v1/dashboard/summary
 * Returns a unified summary of POS metrics.
 */
router.get('/summary', ...tenantMiddleware, getDashboardSummaryController);

export default router;
