import Joi from 'joi';

import { SORT_ORDERS } from '@shared/enum';

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  onlineName: Joi.string().trim().min(2).optional(),
  logo: Joi.string().uri().optional().allow(''),
  isActive: Joi.boolean().default(true),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2),
  onlineName: Joi.string().trim().min(2),
  logo: Joi.string().uri().optional().allow(''),
  isActive: Joi.boolean(),
});

export const categoryListHeaderSchema = Joi.object({
  'brand-id': Joi.string().required(),
  'outlet-id': Joi.string().required(),
});

export const categoryListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  searchText: Joi.string().trim().min(1).max(100).optional(),
  column: Joi.string()
    .valid('name', 'onlineName', 'createdAt', 'updatedAt', 'isActive')
    .optional()
    .default('name'),
  order: Joi.string()
    .valid(...SORT_ORDERS)
    .optional()
    .default('ASC'),
});

export const categoryGetQuerySchema = Joi.object({
  categoryId: Joi.string().required(),
});

export const categoryModifyQuerySchema = Joi.object({
  categoryId: Joi.string().required(),
});

export const categoryBrandHeaderSchema = Joi.object({
  'brand-id': Joi.string().required(),
});
