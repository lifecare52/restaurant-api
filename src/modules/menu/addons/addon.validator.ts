import Joi from 'joi';

import { DIETARIES } from '@shared/enum';

const objectId = Joi.string().length(24).hex();

export const addonHeaderSchema = Joi.object({
  'brand-id': objectId.required(),
  'outlet-id': objectId.required(),
});

export const createAddonSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  items: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().min(1).max(100).required(),
        price: Joi.number().min(0).required(),
        sapCode: Joi.string().trim().max(50).optional(),
        dietary: Joi.string()
          .valid(...DIETARIES)
          .optional(),
        available: Joi.boolean().default(true),
      }),
    )
    .required(),
  isActive: Joi.boolean().default(true),
});

export const updateAddonSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  items: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().min(1).max(100).required(),
      price: Joi.number().min(0).required(),
      sapCode: Joi.string().trim().max(50).optional(),
      dietary: Joi.string()
        .valid(...DIETARIES)
        .optional(),
      available: Joi.boolean().default(true),
    }),
  ),
  isActive: Joi.boolean(),
});

export const addonListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  searchText: Joi.string().trim().optional(),
  column: Joi.string().valid('name', 'createdAt', 'updatedAt', 'isActive').default('name'),
  order: Joi.string().valid('ASC', 'DESC').default('ASC'),
});

export const addonIdQuerySchema = Joi.object({
  addonId: objectId.required(),
});
