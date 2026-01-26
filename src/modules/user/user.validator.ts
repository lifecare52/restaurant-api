import Joi from 'joi';

export const createOwnerSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  brandName: Joi.string().trim().min(2).required(),
  plan: Joi.object({
    name: Joi.string().trim(),
    outletLimit: Joi.number().integer().min(1).default(10),
  }).optional(),
});

export const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('PARTNER', 'STAFF').required(),
  brandId: Joi.string().required(),
  outlets: Joi.array().items(Joi.string()).default([]),
  permissions: Joi.array().items(Joi.string()).default([]),
});

export const createAdminSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});
