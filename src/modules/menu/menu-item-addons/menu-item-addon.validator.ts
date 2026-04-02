import Joi from 'joi';

import { SORT_ORDERS, SortOrder } from '@shared/enum';
import { objectId } from '@shared/utils/common.validation';

export const createMenuItemAddonSchema = Joi.object({
  menuItemId: objectId.required(),
  addonId: objectId.required(),
  allowedItemIds: Joi.array().items(objectId).optional(),
  menuItemVariantId: objectId.optional(),
  isSingleSelect: Joi.boolean().optional(),
  min: Joi.number().integer().min(0).allow(null).optional(),
  max: Joi.number().integer().min(0).allow(null).optional(),
  isActive: Joi.boolean().default(true)
});

export const createBulkMenuItemAddonSchema = Joi.object({
  addonId: objectId.required(),
  allowedItemsId: Joi.array().items(objectId).optional(),
  isSingleSelect: Joi.boolean().optional(),
  min: Joi.number().integer().min(0).allow(null).optional(),
  max: Joi.number().integer().min(0).allow(null).optional(),
  isActive: Joi.boolean().default(true),
  items: Joi.array()
    .items(
      Joi.object({
        menuId: objectId.required(),
        variationId: objectId.optional()
      })
    )
    .min(1)
    .required()
});

export const updateMenuItemAddonSchema = Joi.object({
  allowedItemIds: Joi.array().items(objectId).optional(),
  isSingleSelect: Joi.boolean().optional(),
  min: Joi.number().integer().min(0).allow(null).optional(),
  max: Joi.number().integer().min(0).allow(null).optional(),
  isActive: Joi.boolean()
});

export const menuItemAddonIdQuerySchema = Joi.object({
  menuItemAddonId: objectId.required()
});

export const menuItemAddonListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  searchText: Joi.string().trim().allow('').optional(),
  menuItemId: objectId.optional(),
  addonId: objectId.optional(),
  menuItemVariantId: objectId.optional(),
  column: Joi.string().valid('createdAt', 'updatedAt', 'isActive').default('createdAt'),
  order: Joi.string()
    .valid(...SORT_ORDERS)
    .default(SortOrder.ASC)
});

export const addonMappingQuerySchema = Joi.object({
  addonId: objectId.optional()
});
