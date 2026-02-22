import Joi from 'joi';

import { objectId } from '@shared/utils/common.validation';

export const createMeasurementSchema = Joi.object({
  name: Joi.string().trim().required(),
  measurementType: Joi.string().valid('WEIGHT', 'VOLUME', 'QUANTITY', 'CUSTOM').required(),
  unit: Joi.string().trim().required(),
  baseUnit: Joi.string().trim().required(),
  conversionFactor: Joi.number().min(0.0001).default(1),
  isDecimalAllowed: Joi.boolean().default(true),
  isActive: Joi.boolean().default(true),
});

export const updateMeasurementSchema = Joi.object({
  measurementId: objectId.required(),
  name: Joi.string().trim().optional(),
  measurementType: Joi.string().valid('WEIGHT', 'VOLUME', 'QUANTITY', 'CUSTOM').optional(),
  unit: Joi.string().trim().optional(),
  baseUnit: Joi.string().trim().optional(),
  conversionFactor: Joi.number().min(0.0001).optional(),
  isDecimalAllowed: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
});

export const measurementListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  searchText: Joi.string().trim().optional(),
  column: Joi.string()
    .valid('name', 'measurementType', 'unit', 'baseUnit', 'createdAt', 'updatedAt', 'isActive')
    .default('name'),
  order: Joi.string().valid('ASC', 'DESC').default('ASC'),
  isActive: Joi.boolean().optional(),
});

export const measurementIdSchema = Joi.object({
  measurementId: objectId.required(),
});
