import { recordPayment, getPaymentsByOrder, listPayments } from '@modules/payment/payment.service';
import type { CreatePaymentDTO, PaymentListQuery } from '@modules/payment/payment.types';

import type { Request, Response, NextFunction } from 'express';

const getTenant = (req: Request) => ({
  brandId: (req.headers['brand-id'] as string | undefined) || '',
  outletId: (req.headers['outlet-id'] as string | undefined) || ''
});

const getUserId = (req: Request): string => (req.user?.id || '') as string;

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /payment/record
 * Records a payment transaction against an order (supports partial payments).
 */
export const recordPaymentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { brandId, outletId } = getTenant(req);
    const userId = getUserId(req);
    const dto = req.body as CreatePaymentDTO;
    const result = await recordPayment(brandId, outletId, userId, dto);
    res.locals.response = {
      status: true,
      code: 201,
      message: 'Payment recorded successfully',
      data: result
    };
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * GET /payment/order-payments?orderId=<id>
 * Returns all payment records for a specific order with running totals.
 */
export const getPaymentsByOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { orderId } = req.query as { orderId: string };
    const result = await getPaymentsByOrder(brandId, outletId, orderId);
    res.locals.response = {
      status: true,
      code: 200,
      data: result
    };
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * GET /payment/list
 * Paginated payment transaction list with optional filters.
 */
export const listPaymentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { brandId, outletId } = getTenant(req);
    const result = await listPayments(brandId, outletId, req.query as PaymentListQuery);
    res.locals.response = {
      status: true,
      code: 200,
      data: result.items,
      total: result.total
    };
    next();
  } catch (err) {
    next(err);
  }
};
