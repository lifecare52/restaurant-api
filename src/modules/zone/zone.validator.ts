import Joi from 'joi';

import { objectId } from '@shared/utils/common.validation';

export const createZoneSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  isActive: Joi.boolean().default(true)
});

export const updateZoneSchema = Joi.object({
  name: Joi.string().trim().min(2).allow('').optional(),
  isActive: Joi.boolean().optional()
}).min(1);

export const zoneListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(20),
  searchText: Joi.string().allow('').optional(),
  column: Joi.string().allow('').optional(),
  order: Joi.string().valid('ASC', 'DESC').allow('').optional(),
  isActive: Joi.boolean().optional()
});

export const zoneIdQuerySchema = Joi.object({
  zoneId: objectId.required()
});
