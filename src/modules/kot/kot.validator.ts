import Joi from 'joi';

import { KOT_STATUS, ITEM_STATUS } from '@shared/enum/order.enum';
import { objectId } from '@shared/utils/common.validation';

// ─── KOT Status Update ────────────────────────────────────────────────────────

export const updateKOTStatusSchema = Joi.object({
  kotId: objectId.required(),
  status: Joi.number()
    .valid(...Object.values(KOT_STATUS).filter(v => !isNaN(Number(v))))
    .required()
    .messages({
      'any.required': 'status is required',
      'any.only': 'status must be: 1=PENDING, 2=PREPARING, 3=READY, 4=SERVED, 5=CANCELLED'
    })
});

// ─── KOT Item Status Update ───────────────────────────────────────────────────

export const updateKOTItemStatusSchema = Joi.object({
  kotItemId: objectId.required(),
  status: Joi.number()
    .valid(...Object.values(ITEM_STATUS).filter(v => !isNaN(Number(v))))
    .required()
    .messages({
      'any.required': 'status is required',
      'any.only': 'status must be: 1=PENDING, 2=PREPARING, 3=READY, 4=SERVED, 5=CANCELLED'
    })
});

// ─── KOT List Query ───────────────────────────────────────────────────────────

export const kotListQuerySchema = Joi.object({
  orderId: objectId.optional(),
  status: Joi.number()
    .valid(...Object.values(KOT_STATUS).filter(v => !isNaN(Number(v))))
    .optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(50)
});

// ─── Kitchen Display Query ────────────────────────────────────────────────────

export const kitchenDisplayQuerySchema = Joi.object({
  status: Joi.number()
    .valid(...Object.values(KOT_STATUS).filter(v => !isNaN(Number(v))))
    .optional()
});
