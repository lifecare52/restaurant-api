import { Router } from 'express';

import {
  getSalesReportController,
  getItemSalesReportController
} from '@modules/report/report.controller';

import { commonHeaderSchema } from '@shared/utils/common.validation';
import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

const router = Router({ mergeParams: true });

router.get(
  '/sales',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  getSalesReportController
);

router.get(
  '/item-sales',
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess,
  getItemSalesReportController
);

export default router;
