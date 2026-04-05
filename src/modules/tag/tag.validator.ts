import Joi from 'joi';

import { CUSTOMER_TAG_DISCOUNT_TYPE } from '@modules/tag/tag.types';

import { commonHeaderSchema, objectId } from '@shared/utils/common.validation';

const tagNameSchema = Joi.string().trim().min(2).max(100).pattern(/^[A-Za-z0-9][A-Za-z0-9 .,'&()-]*$/).messages({
  'string.empty': 'name is required',
  'string.min': 'name must be at least 2 characters long',
  'string.max': 'name must be at most 100 characters long',
  'string.pattern.base': 'name contains invalid characters'
});

const discountTypeSchema = Joi.string()
  .valid(...Object.values(CUSTOMER_TAG_DISCOUNT_TYPE))
  .required();

const discountValueSchema = Joi.number().min(0).max(1000000);

const baseTagSchema = {
  name: tagNameSchema,
  discountType: discountTypeSchema,
  discountValue: discountValueSchema.optional(),
  minOrderAmount: Joi.number().min(0).max(10000000).default(0),
  priority: Joi.number().integer().min(1).max(999).default(1),
  isActive: Joi.boolean().default(true)
};

const validateDiscountRules = (value: Record<string, unknown>, helpers: Joi.CustomHelpers) => {
  const discountType = value.discountType as string | undefined;
  const discountValue = Number(value.discountValue ?? 0);

  if (discountType === CUSTOMER_TAG_DISCOUNT_TYPE.NONE && discountValue !== 0) {
    return helpers.message({ custom: 'discountValue must be 0 when discount type is NONE' });
  }

  if (discountType === CUSTOMER_TAG_DISCOUNT_TYPE.PERCENTAGE && (discountValue <= 0 || discountValue > 100)) {
    return helpers.message({ custom: 'discountValue must be between 0.01 and 100 when discount type is PERCENTAGE' });
  }

  if (discountType === CUSTOMER_TAG_DISCOUNT_TYPE.FLAT && discountValue <= 0) {
    return helpers.message({ custom: 'discountValue must be greater than 0 when discount type is FLAT' });
  }

  return value;
};

export const tagHeaderSchema = commonHeaderSchema;

export const tagIdParamSchema = Joi.object({
  id: objectId.required()
});

export const createTagSchema = Joi.object(baseTagSchema).custom(validateDiscountRules);

export const updateTagSchema = Joi.object({
  name: baseTagSchema.name.optional(),
  discountType: Joi.string().valid(...Object.values(CUSTOMER_TAG_DISCOUNT_TYPE)).optional(),
  discountValue: discountValueSchema.optional(),
  minOrderAmount: Joi.number().min(0).max(10000000).optional(),
  priority: Joi.number().integer().min(1).max(999).optional(),
  isActive: Joi.boolean().optional()
}).min(1).custom(validateDiscountRules);

export const tagListQuerySchema = Joi.object({
  search: Joi.string().trim().allow('').optional(),
  searchText: Joi.string().trim().allow('').optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  column: Joi.string()
    .valid('name', 'discountType', 'discountValue', 'minOrderAmount', 'priority', 'isActive', 'createdAt', 'updatedAt')
    .default('createdAt'),
  order: Joi.string().valid('ASC', 'DESC').default('DESC')
});
