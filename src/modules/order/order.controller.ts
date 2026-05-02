import {
  createOrder,
  previewOrderPricing,
  getKOTOrderDetails,
  closeOrder,
  listOrders,
  cancelOrder,
  getTokenDisplay,
  addItemsToOrder,
  removeItemFromOrder,
  updateOrderItem,
  generateKotForOrder
} from '@modules/order/order.service';
import { getPaymentsByOrder } from '@modules/payment/payment.service';
import OutletEntity from '@modules/outlet/outlet.model';

import type { Request, Response, NextFunction } from 'express';

const getTenant = (req: Request) => ({
  brandId: (req.headers['brand-id'] as string | undefined) || '',
  outletId: (req.headers['outlet-id'] as string | undefined) || ''
});

const getUserId = (req: Request): string => (req.user?.id || '') as string;

// ─── Controllers ──────────────────────────────────────────────────────────────

export const createOrderController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const userId = getUserId(req);
    const item = await createOrder(brandId, outletId, userId, req.body);
    res.locals.response = {
      status: true,
      code: 201,
      message: 'Order created successfully',
      data: item
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const previewOrderController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const preview = await previewOrderPricing(brandId, outletId, req.body);
    res.locals.response = {
      status: true,
      code: 200,
      message: 'Order preview calculated successfully',
      data: preview
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const addItemsToOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const result = await addItemsToOrder(brandId, outletId, req.body);
    res.locals.response = {
      status: true,
      code: 200,
      message: 'Items added to order',
      data: result
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const generateKotController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const userId = getUserId(req);
    const result = await generateKotForOrder(brandId, outletId, userId, req.body);
    res.locals.response = {
      status: true,
      code: 201,
      message: 'KOT generated successfully',
      data: result
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const removeItemFromOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const userId = getUserId(req);
    const result = await removeItemFromOrder(brandId, outletId, req.body, userId);
    res.locals.response = {
      status: true,
      code: 200,
      message: 'Item removed from order',
      data: result
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const updateOrderItemController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const userId = getUserId(req);
    const result = await updateOrderItem(brandId, outletId, req.body, userId);
    res.locals.response = { status: true, code: 200, message: 'Order item updated', data: result };
    next();
  } catch (err) {
    next(err);
  }
};

export const getOrderController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const { orderId } = req.query as { orderId: string };
    
    const outlet = await OutletEntity.findById(outletId).lean();
    const isKotEnabled = outlet?.settings?.kotSettings?.isKotEnabled ?? true;
    
    const item = await getKOTOrderDetails(brandId, outletId, orderId, isKotEnabled);
    if (!item) {
      res.locals.response = { status: false, code: 404, message: 'Order not found' };
    } else {
      const paymentsSummary = await getPaymentsByOrder(brandId, outletId, orderId);
      // Clean payments to remove tenant fields
      const cleanedPayments = paymentsSummary.payments.map((p: any) => {
        const paymentObj = p.toObject ? p.toObject() : p;
        const { brandId: _b, outletId: _o, __v: _v, ...rest } = paymentObj;
        return rest;
      });
      item.payments = cleanedPayments;
      res.locals.response = { status: true, code: 200, data: item };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const closeOrderController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const userId = getUserId(req);
    const item = await closeOrder(brandId, outletId, req.body, userId);
    res.locals.response = {
      status: true,
      code: 200,
      message: 'Order closed successfully',
      data: item
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const cancelOrderController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const userId = getUserId(req);
    const item = await cancelOrder(brandId, outletId, req.body, userId);
    res.locals.response = { status: true, code: 200, message: 'Order cancelled', data: item };
    next();
  } catch (err) {
    next(err);
  }
};

export const getTokenDisplayController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const data = await getTokenDisplay(brandId, outletId);
    res.locals.response = { status: true, code: 200, message: 'Token display fetched', data };
    next();
  } catch (err) {
    next(err);
  }
};

export const listOrdersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, outletId } = getTenant(req);
    const result = await listOrders(brandId, outletId, req.query as any);
    res.locals.response = { status: true, code: 200, data: result.items, total: result.total };
    next();
  } catch (err) {
    next(err);
  }
};
