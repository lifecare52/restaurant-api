import Joi from 'joi';

import { VARIATION_DEPARTMENTS } from './variation.types';

const objectId = Joi.string().length(24).hex();

export const variationHeaderSchema = Joi.object({
  'brand-id': objectId.required(),
  'outlet-id': objectId.required(),
});

export const createVariationSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  department: Joi.string()
    .valid(...VARIATION_DEPARTMENTS)
    .required(),
  isActive: Joi.boolean().default(true),
});

export const updateVariationSchema = Joi.object({
  name: Joi.string().trim().min(2),
  department: Joi.string().valid(...VARIATION_DEPARTMENTS),
  isActive: Joi.boolean(),
});

export const variationIdQuerySchema = Joi.object({
  variationId: objectId.required(),
});

export const variationListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  searchText: Joi.string().trim().optional(),
  department: Joi.string().valid(...VARIATION_DEPARTMENTS).optional(),
  column: Joi.string().valid('name', 'department', 'createdAt', 'updatedAt').default('name'),
  order: Joi.string().valid('ASC', 'DESC').default('ASC'),
});
