import Joi from 'joi';

import { SORT_ORDERS } from '@shared/enum';
import { objectId } from '@shared/utils/common.validation';

const measurementConfigSchema = Joi.object({
  measurementId: objectId.required(),
  rate: Joi.number().min(0).allow(null).optional(),
  baseValue: Joi.number().min(0).allow(null).optional(),
  minValue: Joi.number().min(0).allow(null).optional(),
  maxValue: Joi.number().min(0).allow(null).optional(),
  stepValue: Joi.number().min(0).allow(null).optional()
});

export const createMenuItemVariantSchema = Joi.object({
  menuItemId: objectId.required(),
  variationId: objectId.required(),
  basePrice: Joi.number().min(0).required(),
  costPrice: Joi.number().min(0).allow(null).optional(),

  isMeasurementBased: Joi.boolean().default(false),
  measurementConfig: measurementConfigSchema.when('isMeasurementBased', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),

  isActive: Joi.boolean().default(true),
  isDefault: Joi.boolean().default(false)
});

export const updateMenuItemVariantSchema = Joi.object({
  basePrice: Joi.number().min(0).allow(null).optional(),
  costPrice: Joi.number().min(0).allow(null).optional(),

  isMeasurementBased: Joi.boolean(),
  measurementConfig: measurementConfigSchema.when('isMeasurementBased', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),

  isActive: Joi.boolean(),
  isDefault: Joi.boolean()
});

export const menuItemVariantIdQuerySchema = Joi.object({
  menuItemVariantId: objectId.required()
});

export const menuItemVariantListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  menuItemId: objectId.optional(),
  variationId: objectId.optional(),
  column: Joi.string()
    .valid('basePrice', 'costPrice', 'createdAt', 'updatedAt', 'isActive')
    .default('createdAt'),
  order: Joi.string()
    .valid(...SORT_ORDERS)
    .default('ASC')
});
