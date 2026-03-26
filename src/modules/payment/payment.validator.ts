import Joi from 'joi';

import { PAYMENT_METHOD } from '@shared/enum/order.enum';
import { objectId } from '@shared/utils/common.validation';

// ─── Record Payment ───────────────────────────────────────────────────────────

export const recordPaymentSchema = Joi.object({
  orderId: objectId.required(),
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Payment amount must be greater than zero',
    'any.required': 'amount is required'
  }),
  paymentMethod: Joi.number()
    .valid(...Object.values(PAYMENT_METHOD).filter(v => !isNaN(Number(v))))
    .required()
    .messages({
      'any.only': 'paymentMethod must be: 1=CASH, 2=CARD, 3=UPI, 4=WALLET, 5=ONLINE',
      'any.required': 'paymentMethod is required'
    }),
  reference: Joi.string().trim().max(100).optional().allow('', null)
});

// ─── Get Payments By Order (query) ───────────────────────────────────────────

export const getPaymentsByOrderQuerySchema = Joi.object({
  orderId: objectId.required()
});

// ─── List Payments (query) ───────────────────────────────────────────────────

export const listPaymentsQuerySchema = Joi.object({
  orderId: objectId.optional(),
  paymentMethod: Joi.number()
    .valid(...Object.values(PAYMENT_METHOD).filter(v => !isNaN(Number(v))))
    .optional(),
  fromDate: Joi.string().isoDate().optional(),
  toDate: Joi.string().isoDate().optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20)
});
