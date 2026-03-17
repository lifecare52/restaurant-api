import Joi from 'joi';

import { ORDER_TYPES, TAX_CALCULATION_METHODS, TAX_TYPES } from '@modules/tax/tax.types';

import { SORT_ORDERS } from '@shared/enum/sort';

export const createTaxSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  rate: Joi.number().min(0).required(),
  type: Joi.string()
    .valid(...Object.values(TAX_TYPES))
    .default(TAX_TYPES.PERCENTAGE),
  isInclusive: Joi.boolean().default(false),
  calculationMethod: Joi.string()
    .valid(...Object.values(TAX_CALCULATION_METHODS))
    .default(TAX_CALCULATION_METHODS.STANDARD),
  applicableOrderTypes: Joi.array()
    .items(Joi.string().valid(...Object.values(ORDER_TYPES)))
    .default(Object.values(ORDER_TYPES)),
  isActive: Joi.boolean().default(true)
});

export const updateTaxSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  rate: Joi.number().min(0).optional(),
  type: Joi.string()
    .valid(...Object.values(TAX_TYPES))
    .optional(),
  isInclusive: Joi.boolean().optional(),
  calculationMethod: Joi.string()
    .valid(...Object.values(TAX_CALCULATION_METHODS))
    .optional(),
  applicableOrderTypes: Joi.array()
    .items(Joi.string().valid(...Object.values(ORDER_TYPES)))
    .optional(),
  isActive: Joi.boolean().optional()
});

export const createTaxGroupSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  taxes: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
  isActive: Joi.boolean().default(true)
});

export const updateTaxGroupSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  taxes: Joi.array().items(Joi.string().hex().length(24)).min(1).optional(),
  isActive: Joi.boolean().optional()
});

export const taxHeaderSchema = Joi.object({
  'brand-id': Joi.string().required(),
  'outlet-id': Joi.string().required()
}).unknown(true);

export const taxListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  isActive: Joi.boolean().optional(),
  column: Joi.string()
    .valid('name', 'rate', 'type', 'isActive', 'createdAt', 'updatedAt')
    .optional()
    .default('name'),
  order: Joi.string()
    .valid(...SORT_ORDERS)
    .optional()
    .default('ASC')
}).unknown(true);

export const taxGroupListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  isActive: Joi.boolean().optional(),
  column: Joi.string()
    .valid('name', 'isActive', 'createdAt', 'updatedAt')
    .optional()
    .default('name'),
  order: Joi.string()
    .valid(...SORT_ORDERS)
    .optional()
    .default('ASC')
}).unknown(true);

export const taxGetQuerySchema = Joi.object({
  taxId: Joi.string().hex().length(24).required()
});

export const taxGroupGetQuerySchema = Joi.object({
  taxGroupId: Joi.string().hex().length(24).required()
});

export const taxIdParamsSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});
