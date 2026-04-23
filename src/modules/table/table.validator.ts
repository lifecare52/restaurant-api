import Joi from 'joi';

import { TABLE_STATUS } from '@modules/table/table.types';

import { objectId } from '@shared/utils/common.validation';

export const createTableSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  capacity: Joi.number().integer().min(1).optional(),
  zoneId: objectId.optional(),
  status: Joi.number()
    .integer()
    .valid(...Object.values(TABLE_STATUS).filter(v => !isNaN(Number(v))))
    .optional(),
  isActive: Joi.boolean().default(true)
});

export const updateTableSchema = Joi.object({
  name: Joi.string().trim().min(2).optional(),
  capacity: Joi.number().integer().min(1).optional(),
  zoneId: objectId.optional(),
  status: Joi.number()
    .integer()
    .valid(...Object.values(TABLE_STATUS).filter(v => !isNaN(Number(v))))
    .optional(),
  isActive: Joi.boolean().optional()
}).min(1);

export const updateTableStatusSchema = Joi.object({
  status: Joi.number()
    .integer()
    .valid(...Object.values(TABLE_STATUS).filter(v => !isNaN(Number(v))))
    .required()
});

export const tableListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  searchText: Joi.string().allow('').optional(),
  column: Joi.string().allow('').optional(),
  order: Joi.string().valid('ASC', 'DESC').allow('').optional(),
  isActive: Joi.boolean().optional(),
  zoneId: objectId.optional(),
  status: Joi.number()
    .integer()
    .valid(...Object.values(TABLE_STATUS).filter(v => !isNaN(Number(v))))
    .optional()
});

export const tableIdQuerySchema = Joi.object({
  tableId: objectId.required()
});
