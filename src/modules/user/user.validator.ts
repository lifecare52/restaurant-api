import Joi from 'joi';

export const createOwnerSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  username: Joi.string().trim().min(3).required(),
  email: Joi.string().email(),
  password: Joi.string().min(6).required(),
  brandId: Joi.string().required(),
  outlets: Joi.array().items(Joi.string()).min(1).required(),
});

export const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  username: Joi.string().trim().min(3).required(),
  email: Joi.string().email(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('PARTNER', 'STAFF').required(),
  brandId: Joi.string().required(),
  outlets: Joi.array().items(Joi.string()).default([]),
  permissions: Joi.array().items(Joi.string()).default([]),
});

export const createAdminSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  username: Joi.string().trim().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.pattern.base':
        'Password must include uppercase, lowercase, number, and special character',
    }),
});

export const loginSchema = Joi.object({
  username: Joi.string().trim().min(3).required(),
  password: Joi.string().min(6).required(),
});
