import Joi from 'joi';

import { CUISINE_TYPES, OUTLET_TYPES } from '@shared/constants';
import { GstScheme } from '@shared/enum';

export const createOutletSchema = Joi.object({
  basicInfo: Joi.object({
    name: Joi.string().trim().min(2).required(),
    logo: Joi.string().uri().optional(),
    cuisineType: Joi.array()
      .items(Joi.string().valid(...CUISINE_TYPES))
      .optional(),
    outletType: Joi.string()
      .valid(...OUTLET_TYPES)
      .required()
  }).required(),
  contact: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().trim().min(6).max(20).required(),
    country: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    address: Joi.string().trim().required()
  }).required(),
  settings: Joi.object({
    gstEnabled: Joi.boolean().default(false),
    gstNo: Joi.string()
      .trim()
      .when('gstEnabled', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional().allow('')
      }),
    gstScheme: Joi.string()
      .valid(...Object.values(GstScheme))
      .when('gstEnabled', {
        is: true,
        then: Joi.invalid(GstScheme.NONE).required(),
        otherwise: Joi.optional()
      })
      .default(GstScheme.NONE),
    currency: Joi.string().trim().optional()
  }).optional()
});

export const updateOutletSchema = Joi.object({
  basicInfo: Joi.object({
    name: Joi.string().trim().min(2),
    logo: Joi.string().uri(),
    cuisineType: Joi.array().items(Joi.string().valid(...CUISINE_TYPES)),
    outletType: Joi.string().valid(...OUTLET_TYPES)
  }),
  contact: Joi.object({
    email: Joi.string().email(),
    phone: Joi.string().trim().min(6).max(20),
    country: Joi.string().trim(),
    state: Joi.string().trim(),
    city: Joi.string().trim(),
    address: Joi.string().trim()
  }),
  settings: Joi.object({
    gstEnabled: Joi.boolean(),
    gstNo: Joi.string().trim().allow(''),
    gstScheme: Joi.string().valid(...Object.values(GstScheme)),
    currency: Joi.string().trim()
  }).when('.gstEnabled', {
    is: true,
    then: Joi.object({
      gstNo: Joi.string().trim().required(),
      gstScheme: Joi.string()
        .valid(...Object.values(GstScheme))
        .invalid(GstScheme.NONE)
        .required()
    })
  })
});

export const outletBrandQuerySchema = Joi.object({
  brandId: Joi.string().required()
});

export const outletUpdateQuerySchema = Joi.object({
  brandId: Joi.string().required(),
  outletId: Joi.string().required()
});

export const outletDetailHeaderSchema = Joi.object({
  'brand-id': Joi.string().required(),
  'outlet-id': Joi.string().required()
});

export const outletBrandHeaderSchema = Joi.object({
  'brand-id': Joi.string().required()
});
