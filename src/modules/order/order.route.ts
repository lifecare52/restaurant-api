import { Router } from 'express';

import {
  createOrderController,
  previewOrderController,
  getOrderController,
  closeOrderController,
  cancelOrderController,
  getTokenDisplayController,
  listOrdersController,
  addItemsToOrderController,
  removeItemFromOrderController,
  updateOrderItemController,
  generateKotController
} from '@modules/order/order.controller';
import {
  createOrderSchema,
  previewOrderSchema,
  addItemsToOrderSchema,
  removeOrderItemSchema,
  updateOrderItemSchema,
  closeOrderSchema,
  cancelOrderSchema,
  listOrdersQuerySchema,
  getOrderQuerySchema,
  generateKotSchema
} from '@modules/order/order.validator';

import { commonHeaderSchema } from '@shared/utils/common.validation';
import { validateRequest } from '@shared/utils/validateRequest';

import { auth } from '@middlewares/auth.middleware';
import { requireBrandAccess, requireOutletAccess } from '@middlewares/guard.middleware';

import orderMenuItemsRouter from './menu-items/order-menu-item.route';

const router = Router({ mergeParams: true });

router.use('/menu-items', orderMenuItemsRouter);

const tenantMiddleware = [
  auth,
  validateRequest(commonHeaderSchema, 'headers'),
  requireBrandAccess,
  requireOutletAccess
];

router.post(
  '/preview',
  ...tenantMiddleware,
  validateRequest(previewOrderSchema, 'body'),
  previewOrderController
);

// POST /orders — Create a new order
router.post(
  '/',
  ...tenantMiddleware,
  validateRequest(createOrderSchema, 'body'),
  createOrderController
);

// POST /orders/add-items — Add items to an existing open order
router.post(
  '/add-items',
  ...tenantMiddleware,
  validateRequest(addItemsToOrderSchema, 'body'),
  addItemsToOrderController
);

// POST /orders/generate-kot — Smart KOT generation (Create or Append)
router.post(
  '/generate-kot',
  ...tenantMiddleware,
  validateRequest(generateKotSchema, 'body'),
  generateKotController
);

// POST /orders/remove-item — Cancel a specific item from an order (generates void KOT)
router.post(
  '/remove-item',
  ...tenantMiddleware,
  validateRequest(removeOrderItemSchema, 'body'),
  removeItemFromOrderController
);

// PATCH /orders/update-item — Update quantity or instruction on a pending item
router.patch(
  '/update-item',
  ...tenantMiddleware,
  validateRequest(updateOrderItemSchema, 'body'),
  updateOrderItemController
);

// GET /orders — List orders with filters + pagination
router.get(
  '/',
  ...tenantMiddleware,
  validateRequest(listOrdersQuerySchema, 'query'),
  listOrdersController
);

// GET /orders/detail?orderId=... — Get single order with items and addons
router.get(
  '/detail',
  ...tenantMiddleware,
  validateRequest(getOrderQuerySchema, 'query'),
  getOrderController
);

// POST /orders/close — Close (complete) an order
router.post(
  '/close',
  ...tenantMiddleware,
  validateRequest(closeOrderSchema, 'body'),
  closeOrderController
);

// POST /orders/cancel — Cancel an order
router.post(
  '/cancel',
  ...tenantMiddleware,
  validateRequest(cancelOrderSchema, 'body'),
  cancelOrderController
);

// GET /orders/tokens — Token display board (preparing vs ready takeaway orders)
router.get('/tokens', ...tenantMiddleware, getTokenDisplayController);

export default router;
