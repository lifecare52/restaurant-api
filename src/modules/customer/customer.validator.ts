import Joi from 'joi';

import { commonHeaderSchema, objectId } from '@shared/utils/common.validation';

const normalizeMobile = (value: string, helpers: Joi.CustomHelpers) => {
  const digitsOnly = value.replace(/\D/g, '');
  const normalized = digitsOnly.length === 12 && digitsOnly.startsWith('91') ? digitsOnly.slice(2) : digitsOnly;

  if (!/^[6-9]\d{9}$/.test(normalized)) {
    return helpers.error('string.mobileNumber');
  }

  return normalized;
};

const customerNameSchema = Joi.string().trim().min(2).max(120).pattern(/^[A-Za-z0-9][A-Za-z0-9 .,'&()-]*$/).messages({
  'string.empty': 'name is required',
  'string.min': 'name must be at least 2 characters long',
  'string.max': 'name must be at most 120 characters long',
  'string.pattern.base': 'name contains invalid characters'
});

const customerMobileSchema = Joi.string().trim().custom(normalizeMobile).required().messages({
  'string.empty': 'mobile is required',
  'string.mobileNumber': 'mobile must be a valid 10-digit Indian mobile number'
});

const customerEmailSchema = Joi.string().trim().lowercase().email({ tlds: { allow: false } }).optional().allow('', null).messages({
  'string.email': 'email must be a valid email address'
});

const customerTagIdsSchema = Joi.array().items(objectId).unique().max(20).default([]).messages({
  'array.max': 'tags cannot exceed 20 items'
});

export const customerHeaderSchema = commonHeaderSchema;

export const customerIdParamSchema = Joi.object({
  id: objectId.required()
});

export const customerTagParamSchema = Joi.object({
  id: objectId.required(),
  tagId: objectId.required()
});

export const createCustomerSchema = Joi.object({
  name: customerNameSchema.required(),
  mobile: customerMobileSchema,
  email: customerEmailSchema,
  tags: customerTagIdsSchema.optional(),
  loyaltyPoints: Joi.number().integer().min(0).max(1000000).default(0),
  creditBalance: Joi.number().min(0).max(10000000).default(0),
  isActive: Joi.boolean().default(true),
  totalSpent: Joi.any().forbidden().messages({ 'any.unknown': 'totalSpent is managed by the system' }),
  totalOrders: Joi.any().forbidden().messages({ 'any.unknown': 'totalOrders is managed by the system' }),
  lastVisitAt: Joi.any().forbidden().messages({ 'any.unknown': 'lastVisitAt is managed by the system' })
});

export const updateCustomerSchema = Joi.object({
  name: customerNameSchema.optional(),
  mobile: customerMobileSchema.optional(),
  email: customerEmailSchema,
  tags: customerTagIdsSchema.optional(),
  loyaltyPoints: Joi.number().integer().min(0).max(1000000).optional(),
  creditBalance: Joi.number().min(0).max(10000000).optional(),
  isActive: Joi.boolean().optional(),
  totalSpent: Joi.any().forbidden().messages({ 'any.unknown': 'totalSpent is managed by the system' }),
  totalOrders: Joi.any().forbidden().messages({ 'any.unknown': 'totalOrders is managed by the system' }),
  lastVisitAt: Joi.any().forbidden().messages({ 'any.unknown': 'lastVisitAt is managed by the system' })
}).min(1);

export const customerListQuerySchema = Joi.object({
  search: Joi.string().trim().allow('').optional(),
  searchText: Joi.string().trim().allow('').optional(),
  tagId: objectId.optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  column: Joi.string()
    .valid('name', 'mobile', 'email', 'loyaltyPoints', 'totalSpent', 'totalOrders', 'lastVisitAt', 'creditBalance', 'isActive', 'createdAt', 'updatedAt')
    .default('createdAt'),
  order: Joi.string().valid('ASC', 'DESC').default('DESC')
});

export const assignCustomerTagsSchema = Joi.object({
  tagIds: customerTagIdsSchema.min(1).required()
});
