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
  permissions: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().default(true),
  salary: Joi.number().min(0),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  role: Joi.string().valid('PARTNER', 'STAFF'),
  outlets: Joi.array().items(Joi.string()),
  permissions: Joi.array().items(Joi.string()),
  isActive: Joi.boolean(),
  salary: Joi.number().min(0),
});

export const userListQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  searchText: Joi.string().allow(''),
  role: Joi.string().valid('PARTNER', 'STAFF'),
  column: Joi.string()
    .valid('name', 'username', 'email', 'createdAt', 'updatedAt', 'isActive')
    .default('createdAt'),
  order: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

export const userIdQuerySchema = Joi.object({
  userId: Joi.string().required(),
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
