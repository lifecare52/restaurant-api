import Joi from 'joi';

const objectId = Joi.string().length(24).hex();

export const menuItemVariantHeaderSchema = Joi.object({
  'brand-id': objectId.required(),
  'outlet-id': objectId.required(),
});

export const createMenuItemVariantSchema = Joi.object({
  menuItemId: objectId.required(),
  variationId: objectId.required(),
  price: Joi.number().min(0).required(),
  isActive: Joi.boolean().default(true),
  isDefault: Joi.boolean().default(false),
});

export const updateMenuItemVariantSchema = Joi.object({
  price: Joi.number().min(0),
  isActive: Joi.boolean(),
  isDefault: Joi.boolean(),
});

export const menuItemVariantIdQuerySchema = Joi.object({
  menuItemVariantId: objectId.required(),
});

export const menuItemVariantListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  menuItemId: objectId.optional(),
  variationId: objectId.optional(),
  column: Joi.string().valid('price', 'createdAt', 'updatedAt').default('createdAt'),
  order: Joi.string().valid('ASC', 'DESC').default('ASC'),
});
