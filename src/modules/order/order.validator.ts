import Joi from 'joi';

import { ORDER_TYPE, PAYMENT_METHOD } from '@shared/enum/order.enum';
import { objectId } from '@shared/utils/common.validation';

const addonSchema = Joi.object({
  addonId: objectId.required(),
  addonItemId: objectId.required(),
  quantity: Joi.number().integer().min(1).required()
});

const measurementSchema = Joi.object({
  measurementId: Joi.string().optional(),
  unit: Joi.string().required(),
  enteredQuantity: Joi.number().positive().required(),
  totalPrice: Joi.number().positive().allow(null).optional()
});

const orderItemSchema = Joi.object({
  menuItemId: objectId.required(),
  quantity: Joi.number().integer().min(1).allow(null).optional(),
  measurement: measurementSchema.optional(),
  variationId: objectId.optional(),
  instruction: Joi.string().trim().max(300).optional().allow('', null),
  addons: Joi.array().items(addonSchema).optional().default([])
}).or('quantity', 'measurement');

export const createOrderSchema = Joi.object({
  orderType: Joi.number()
    .valid(...Object.values(ORDER_TYPE).filter(v => !isNaN(Number(v))))
    .required()
    .messages({ 'any.required': 'orderType is required. 1=DINE_IN, 2=TAKEAWAY, 3=DELIVERY' }),
  tableId: objectId.when('orderType', {
    is: ORDER_TYPE.DINE_IN,
    then: Joi.required().messages({ 'any.required': 'tableId is required for DINE_IN orders' }),
    otherwise: Joi.optional().allow(null, '')
  }),
  customerId: objectId.optional().allow(null, ''),
  manualTagId: objectId.optional().allow(null, ''),
  items: Joi.array().items(orderItemSchema).min(1).required().messages({
    'array.min': 'At least one item is required',
    'any.required': 'items array is required'
  }),
  notes: Joi.string().trim().max(500).optional().allow('', null),
  shippingAddress: Joi.when('orderType', {
    is: ORDER_TYPE.DELIVERY,
    then: Joi.string()
      .min(5)
      .required()
      .messages({ 'any.required': 'shippingAddress is required for DELIVERY orders' }),
    otherwise: Joi.string().optional().allow('', null)
  })
});

export const previewOrderSchema = Joi.object({
  orderType: Joi.number()
    .valid(...Object.values(ORDER_TYPE).filter(v => !isNaN(Number(v))))
    .required(),
  tableId: objectId.optional().allow(null, ''),
  customerId: objectId.optional().allow(null, ''),
  manualTagId: objectId.optional().allow(null, ''),
  items: Joi.array().items(orderItemSchema).min(1).required().messages({
    'array.min': 'At least one item is required',
    'any.required': 'items array is required'
  }),
  notes: Joi.string().trim().max(500).optional().allow('', null),
  shippingAddress: Joi.string().optional().allow('', null)
});

export const addItemsToOrderSchema = Joi.object({
  orderId: objectId.required(),
  items: Joi.array().items(orderItemSchema).min(1).optional().messages({
    'array.min': 'At least one item is required'
  }),
  manualTagId: objectId.optional().allow(null, '')
}).or('items', 'manualTagId');

export const removeOrderItemSchema = Joi.object({
  orderId: objectId.required(),
  orderItemId: objectId.required(),
  cancelReason: Joi.string().max(300).optional().allow('', null)
});

export const updateOrderItemSchema = Joi.object({
  orderId: objectId.required(),
  orderItemId: objectId.required(),
  quantity: Joi.number().integer().min(1).optional(),
  instruction: Joi.string().trim().max(300).optional().allow('', null)
}).or('quantity', 'instruction');

export const closeOrderSchema = Joi.object({
  orderId: objectId.required(),
  paymentMethod: Joi.number()
    .valid(...Object.values(PAYMENT_METHOD).filter(v => !isNaN(Number(v))))
    .optional()
    .messages({ 'any.only': 'paymentMethod must be: 1=CASH, 2=CARD, 3=UPI, 4=WALLET, 5=ONLINE' })
});

export const cancelOrderSchema = Joi.object({
  orderId: objectId.required(),
  cancellationReason: Joi.string().max(500).optional().allow('', null)
});

export const listOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  status: Joi.number().integer().allow(null).optional(),
  orderType: Joi.number().integer().allow(null).optional(),
  tableId: objectId.optional(),
  waiterId: objectId.optional(),
  orderNumber: Joi.string().allow('').optional(),
  fromDate: Joi.string().isoDate().optional(),
  toDate: Joi.string().isoDate().optional()
});

export const getOrderQuerySchema = Joi.object({
  orderId: objectId.required()
});

export const generateKotSchema = Joi.object({
  orderId: objectId.optional().allow(null, ''),
  orderType: Joi.number()
    .valid(...Object.values(ORDER_TYPE).filter(v => !isNaN(Number(v))))
    .when('orderId', {
      is: Joi.alternatives().try(Joi.valid('', null), Joi.not(Joi.exist())),
      then: Joi.required(),
      otherwise: Joi.optional().allow(null)
    }),
  tableId: objectId.optional().allow(null, ''),
  customerId: objectId.optional().allow(null, ''),
  items: Joi.array().items(orderItemSchema).min(1).required().messages({
    'array.min': 'At least one item is required'
  }),
  manualTagId: objectId.optional().allow(null, ''),
  notes: Joi.string().trim().max(500).optional().allow('', null)
});
