import Joi from 'joi';

import { SORT_ORDERS, SortOrder } from '@shared/enum';

const objectId = Joi.string().length(24).hex();

export const menuItemAddonHeaderSchema = Joi.object({
  'brand-id': objectId.required(),
  'outlet-id': objectId.required(),
});

export const createMenuItemAddonSchema = Joi.object({
  menuItemId: objectId.required(),
  addonId: objectId.required(),
  allowedItemIds: Joi.array().items(objectId).optional(),
  menuItemVariantId: objectId.optional(),
  isSingleSelect: Joi.boolean().optional(),
  min: Joi.number()
    .integer()
    .min(0)
    .when('max', { is: Joi.exist(), then: Joi.number().integer().min(0).max(Joi.ref('max')) })
    .when('isSingleSelect', { is: true, then: Joi.number().valid(0, 1) })
    .optional(),
  max: Joi.number()
    .integer()
    .min(1)
    .when('isSingleSelect', { is: true, then: Joi.number().valid(1) })
    .optional(),
  isActive: Joi.boolean().default(true),
});

export const updateMenuItemAddonSchema = Joi.object({
  allowedItemIds: Joi.array().items(objectId).optional(),
  isSingleSelect: Joi.boolean().optional(),
  min: Joi.number()
    .integer()
    .min(0)
    .when('max', { is: Joi.exist(), then: Joi.number().integer().min(0).max(Joi.ref('max')) })
    .when('isSingleSelect', { is: true, then: Joi.number().valid(0, 1) })
    .optional(),
  max: Joi.number()
    .integer()
    .min(1)
    .when('isSingleSelect', { is: true, then: Joi.number().valid(1) })
    .optional(),
  isActive: Joi.boolean(),
});

export const menuItemAddonIdQuerySchema = Joi.object({
  menuItemAddonId: objectId.required(),
});

export const menuItemAddonListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  searchText: Joi.string().trim().optional(),
  menuItemId: objectId.optional(),
  addonId: objectId.optional(),
  menuItemVariantId: objectId.optional(),
  column: Joi.string().valid('createdAt', 'updatedAt', 'isActive').default('createdAt'),
  order: Joi.string()
    .valid(...SORT_ORDERS)
    .default(SortOrder.ASC),
});
