import Joi from 'joi';

import { OUTLET_TYPES, CUISINE_TYPES } from '@shared/constants';

export const createOutletSchema = Joi.object({
  basicInfo: Joi.object({
    name: Joi.string().trim().min(2).required(),
    logo: Joi.string().uri().optional(),
    cuisineType: Joi.array()
      .items(Joi.string().valid(...CUISINE_TYPES))
      .optional(),
    outletType: Joi.string()
      .valid(...OUTLET_TYPES)
      .required(),
  }).required(),
  contact: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().trim().min(6).max(20).required(),
    country: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    address: Joi.string().trim().required(),
  }).required(),
  settings: Joi.object({
    gstNo: Joi.string().trim().optional(),
    currency: Joi.string().trim().optional(),
    CGST: Joi.number().integer().min(0).max(100).optional(),
    SGST: Joi.number().integer().min(0).max(100).optional(),
  }).optional(),
});

export const updateOutletSchema = Joi.object({
  basicInfo: Joi.object({
    name: Joi.string().trim().min(2),
    logo: Joi.string().uri(),
    cuisineType: Joi.array().items(Joi.string().valid(...CUISINE_TYPES)),
    outletType: Joi.string().valid(...OUTLET_TYPES),
  }),
  contact: Joi.object({
    email: Joi.string().email(),
    phone: Joi.string().trim().min(6).max(20),
    country: Joi.string().trim(),
    state: Joi.string().trim(),
    city: Joi.string().trim(),
    address: Joi.string().trim(),
  }),
  settings: Joi.object({
    gstNo: Joi.string().trim(),
    currency: Joi.string().trim(),
    CGST: Joi.number().integer().min(0).max(100),
    SGST: Joi.number().integer().min(0).max(100),
  }),
});

export const outletBrandQuerySchema = Joi.object({
  brandId: Joi.string().required(),
});

export const outletUpdateQuerySchema = Joi.object({
  brandId: Joi.string().required(),
  outletId: Joi.string().required(),
});
