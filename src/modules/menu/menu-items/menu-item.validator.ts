import Joi from 'joi';

import { DIETARIES } from '@shared/enum';

const objectId = Joi.string().length(24).hex();

const measurementConfigSchema = Joi.object({
  measurementId: objectId.required(),
  rate: Joi.number().min(0).optional(),
  baseValue: Joi.number().min(0).optional(),
  minValue: Joi.number().min(0).optional(),
  maxValue: Joi.number().min(0).optional(),
  stepValue: Joi.number().min(0).optional(),
});

export const createMenuItemSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  shortCodes: Joi.array()
    .items(Joi.string().trim().min(1))
    .min(1)
    .max(2)
    .unique((a, b) => a.toLowerCase() === b.toLowerCase())
    .messages({ 'array.unique': 'shortCodes must be unique (case-insensitive)' })
    .optional(),
  categoryId: objectId.required(),

  dietary: Joi.string()
    .valid(...DIETARIES)
    .required(),

  basePrice: Joi.number().min(0).allow(null).optional(),
  costPrice: Joi.number().min(0).optional(),

  isMeasurementBased: Joi.boolean().default(false),
  measurementConfig: measurementConfigSchema.when('isMeasurementBased', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  variations: Joi.array()
    .items(
      Joi.object({
        variationId: objectId.required(),
        basePrice: Joi.number().min(0).required(),
        costPrice: Joi.number().min(0).optional(),

        isMeasurementBased: Joi.boolean().default(false),
        measurementConfig: measurementConfigSchema.when('isMeasurementBased', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),

        addons: Joi.array()
          .items(
            Joi.object({
              addonId: objectId.required(),
              isSingleSelect: Joi.boolean().optional(),
              min: Joi.number().integer().min(0).optional(),
              max: Joi.number().integer().min(0).optional(),
              allowedItems: Joi.any().forbidden(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  addons: Joi.array()
    .items(
      Joi.object({
        addonId: objectId.required(),
        isSingleSelect: Joi.boolean().optional(),
        min: Joi.number().integer().min(0).optional(),
        max: Joi.number().integer().min(0).optional(),
        allowedItems: Joi.any().forbidden(),
      }),
    )
    .optional(),

  online: Joi.boolean().default(false),
  takeAway: Joi.boolean().default(false),
  dineIn: Joi.boolean().default(false),

  isActive: Joi.boolean().default(true),
});

export const updateMenuItemSchema = Joi.object({
  name: Joi.string().trim().min(2),
  shortCodes: Joi.array()
    .items(Joi.string().trim().min(1))
    .max(2)
    .unique((a, b) => a.toLowerCase() === b.toLowerCase())
    .messages({ 'array.unique': 'shortCodes must be unique (case-insensitive)' })
    .optional(),
  categoryId: objectId,

  dietary: Joi.string().valid(...DIETARIES),

  basePrice: Joi.number().min(0).allow(null).optional(),
  costPrice: Joi.number().min(0).optional(),

  online: Joi.boolean().default(false),
  takeAway: Joi.boolean().default(false),
  dineIn: Joi.boolean().default(false),

  isMeasurementBased: Joi.boolean(),
  measurementConfig: measurementConfigSchema.when('isMeasurementBased', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  variations: Joi.array()
    .items(
      Joi.object({
        variationId: objectId.required(),
        basePrice: Joi.number().min(0).optional(),
        costPrice: Joi.number().min(0).optional(),
        // Measurement fields for variation
        isMeasurementBased: Joi.boolean().optional(),
        measurementConfig: measurementConfigSchema.when('isMeasurementBased', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),

        addons: Joi.array()
          .items(
            Joi.object({
              addonId: objectId.required(),
              isSingleSelect: Joi.boolean().optional(),
              min: Joi.number().integer().min(0).optional(),
              max: Joi.number().integer().min(0).optional(),
              allowedItems: Joi.array().items(objectId).optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  addons: Joi.array()
    .items(
      Joi.object({
        addonId: objectId.required(),
        isSingleSelect: Joi.boolean().optional(),
        min: Joi.number().integer().min(0).optional(),
        max: Joi.number().integer().min(0).optional(),
        allowedItems: Joi.array().items(objectId).optional(),
      }),
    )
    .optional(),

  isActive: Joi.boolean(),
});

export const menuItemHeaderSchema = Joi.object({
  'brand-id': objectId.required(),
  'outlet-id': objectId.required(),
}).unknown(true);

export const menuItemListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(20),
  searchText: Joi.string().allow('').optional(),
  column: Joi.string().optional(),
  order: Joi.string().valid('ASC', 'DESC').optional(),
  categoryId: objectId.optional(),
});

export const menuItemIdQuerySchema = Joi.object({
  menuItemId: objectId.required(),
});

export const bulkUpdateMenuItemAvailabilitySchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        _id: objectId.required(),
        online: Joi.boolean().required(),
        takeAway: Joi.boolean().required(),
        dineIn: Joi.boolean().required(),
      }),
    )
    .required(),
});

export const addonMappingQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(20),
  column: Joi.string().optional(),
  order: Joi.string().valid('ASC', 'DESC').optional(),
  addonId: objectId.optional(),
});
