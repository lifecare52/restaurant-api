import Joi from 'joi';

export const createBrandSchema = Joi.object({
  ownerId: Joi.string().required(),
  name: Joi.string().trim().min(2).required(),
  plan: Joi.object({
    name: Joi.string().trim(),
    outletLimit: Joi.number().integer().min(1).default(10),
  }).optional(),
});

export const updateBrandSchema = Joi.object({
  name: Joi.string().trim().min(2),
  plan: Joi.object({
    name: Joi.string().trim(),
    outletLimit: Joi.number().integer().min(1),
  }),
});

export const brandIdQuerySchema = Joi.object({
  brandId: Joi.string().required(),
});
