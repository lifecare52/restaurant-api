import { Router } from 'express';

import {
  recordPaymentController,
  getPaymentsByOrderController,
  listPaymentsController
} from '@modules/payment/payment.controller';
import {
  recordPaymentSchema,
  getPaymentsByOrderQuerySchema,
  listPaymentsQuerySchema
} from '@modules/payment/payment.validator';

import { commonHeaderSchema } from '@shared/utils/common.validation';
import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

const router = Router({ mergeParams: true });

const tenantMiddleware = [
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess
];

// POST /payment/record — Record a payment transaction (supports partial payments)
router.post(
  '/record',
  ...tenantMiddleware,
  validateRequest(recordPaymentSchema, 'body'),
  recordPaymentController
);

// GET /payment/order-payments?orderId= — All payments + running totals for one order
router.get(
  '/order-payments',
  ...tenantMiddleware,
  validateRequest(getPaymentsByOrderQuerySchema, 'query'),
  getPaymentsByOrderController
);

// GET /payment/list — Paginated payment history with filters
router.get(
  '/list',
  ...tenantMiddleware,
  validateRequest(listPaymentsQuerySchema, 'query'),
  listPaymentsController
);

export default router;
