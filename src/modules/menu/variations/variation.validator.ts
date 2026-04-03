import Joi from 'joi';

import { VARIATION_DEPARTMENTS } from '@modules/menu/variations/variation.types';

import { objectId } from '@shared/utils/common.validation';

export const createVariationSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  department: Joi.string()
    .valid(...VARIATION_DEPARTMENTS)
    .required(),
  isActive: Joi.boolean().default(true),
  taxGroupId: objectId.optional().allow('')
});

export const updateVariationSchema = Joi.object({
  name: Joi.string().trim().min(2).allow(''),
  department: Joi.string().valid(...VARIATION_DEPARTMENTS),
  isActive: Joi.boolean(),
  taxGroupId: objectId.optional().allow('')
});

export const variationIdQuerySchema = Joi.object({
  variationId: objectId.required()
});

export const variationListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  searchText: Joi.string().trim().allow('').optional(),
  department: Joi.string()
    .valid(...VARIATION_DEPARTMENTS)
    .allow('')
    .optional(),
  column: Joi.string()
    .valid('name', 'department', 'createdAt', 'updatedAt', 'isActive')
    .allow('')
    .default('name'),
  order: Joi.string().valid('ASC', 'DESC').allow('').default('ASC')
});
