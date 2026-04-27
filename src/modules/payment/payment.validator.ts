import Joi from 'joi';

import { PAYMENT_METHOD } from '@shared/enum/order.enum';
import { objectId } from '@shared/utils/common.validation';

// ─── Record Payment ───────────────────────────────────────────────────────────

export const recordPaymentSchema = Joi.object({
  orderId: objectId.required(),
  amount: Joi.number().positive().precision(2).optional().messages({
    'number.positive': 'Payment amount must be greater than zero'
  }),
  paymentMethod: Joi.number()
    .valid(...Object.values(PAYMENT_METHOD).filter(v => !isNaN(Number(v))))
    .optional(),
  reference: Joi.string().trim().max(100).optional().allow('', null),
  payments: Joi.array()
    .items(
      Joi.object({
        amount: Joi.number().positive().precision(2).required().messages({
          'number.positive': 'Payment amount must be greater than zero',
          'any.required': 'amount is required in split payment'
        }),
        paymentMethod: Joi.number()
          .valid(...Object.values(PAYMENT_METHOD).filter(v => !isNaN(Number(v))))
          .required()
          .messages({
            'any.required': 'paymentMethod is required in split payment'
          }),
        reference: Joi.string().trim().max(100).optional().allow('', null)
      })
    )
    .optional()
}).custom((value, helpers) => {
  const hasSingle = value.amount !== undefined && value.paymentMethod !== undefined;
  const hasMultiple = value.payments && value.payments.length > 0;

  if (!hasSingle && !hasMultiple) {
    return helpers.message({
      custom: 'Provide either a single amount + paymentMethod or a payments array'
    });
  }
  return value;
});

// ─── Settle Payment ───────────────────────────────────────────────────────────

export const settlePaymentSchema = Joi.object({
  orderId: objectId.required(),
  payments: Joi.array()
    .items(
      Joi.object({
        amount: Joi.number().positive().precision(2).required().messages({
          'number.positive': 'Payment amount must be greater than zero',
          'any.required': 'amount is required in split payment'
        }),
        paymentMethod: Joi.number()
          .valid(...Object.values(PAYMENT_METHOD).filter(v => !isNaN(Number(v))))
          .required(),
        reference: Joi.string().trim().max(100).optional().allow('', null)
      })
    )
    .required(),
  useCustomerCredit: Joi.boolean().optional().default(false)
});

// ─── Refund Payment ───────────────────────────────────────────────────────────

export const refundPaymentSchema = Joi.object({
  orderId: objectId.required(),
  refundAmount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Refund amount must be greater than zero'
  }),
  refundMethod: Joi.number()
    .valid(...Object.values(PAYMENT_METHOD).filter(v => !isNaN(Number(v))))
    .optional().allow(null),
  reason: Joi.string().trim().max(500).optional().allow('', null)
});


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
