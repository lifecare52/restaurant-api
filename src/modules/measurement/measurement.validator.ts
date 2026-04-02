import Joi from 'joi';

import { objectId } from '@shared/utils/common.validation';

export const createMeasurementSchema = Joi.object({
  name: Joi.string().trim().required(),
  measurementType: Joi.string().valid('WEIGHT', 'VOLUME', 'QUANTITY', 'CUSTOM').required(),
  unit: Joi.string().trim().required(),
  baseUnit: Joi.string().trim().required(),
  conversionFactor: Joi.number().min(0.0001).default(1),
  isDecimalAllowed: Joi.boolean().default(true),
  isActive: Joi.boolean().default(true)
});

export const updateMeasurementSchema = Joi.object({
  measurementId: objectId.required(),
  name: Joi.string().trim().allow('').optional(),
  measurementType: Joi.string().valid('WEIGHT', 'VOLUME', 'QUANTITY', 'CUSTOM').optional(),
  unit: Joi.string().trim().allow('').optional(),
  baseUnit: Joi.string().trim().allow('').optional(),
  conversionFactor: Joi.number().min(0.0001).optional(),
  isDecimalAllowed: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
});

export const measurementListQuerySchema = Joi.object({
  searchText: Joi.string().trim().allow('').optional(),
  column: Joi.string()
    .valid('name', 'measurementType', 'unit', 'baseUnit', 'createdAt', 'updatedAt', 'isActive')
    .allow('')
    .default('name'),
  order: Joi.string().valid('ASC', 'DESC').allow('').default('ASC')
});

export const measurementIdSchema = Joi.object({
  measurementId: objectId.required()
});
